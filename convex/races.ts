import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const createRace = mutation({
  args: {},
  handler: async (ctx) => {
    const user: Doc<"users"> = await ctx.runMutation(
      internal.users.getOrCreateAuthedUser,
      {},
    );

    const raceId = await ctx.db.insert("races", {
      status: "waiting",
      participants: [
        {
          userId: user._id,
          name: user.name,
        },
      ],
    });
    return raceId;
  },
});

export const joinRace = mutation({
  args: { raceId: v.id("races") },
  handler: async (ctx, args) => {
    const user = await ctx.runMutation(
      internal.users.getOrCreateAuthedUser,
      {},
    );

    const race = await ctx.db.get(args.raceId);
    if (!race) throw new Error("Race not found");
    if (race.status !== "waiting") throw new Error("Race already started");

    // Check if user already in race
    const isParticipant = race.participants.some((p) => p.userId === user._id);
    if (isParticipant) return args.raceId;

    // Add user to participants
    await ctx.db.patch(args.raceId, {
      participants: [
        ...race.participants,
        {
          userId: user._id,
          name: user.name,
        },
      ],
    });

    return args.raceId;
  },
});

export const listWaitingRaces = query({
  args: {},
  handler: async (ctx) => {
    const races = await ctx.db
      .query("races")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(10);

    return races;
  },
});

export const getActiveRaceForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    // Find races where user is a participant and race is not finished
    const races = await ctx.db
      .query("races")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "finished"),
          q.or(
            q.eq(q.field("status"), "waiting"),
            q.eq(q.field("status"), "countdown"),
            q.eq(q.field("status"), "racing"),
          ),
        ),
      )
      .order("desc")
      .take(50);

    // Find race where user is participant
    for (const race of races) {
      const isParticipant = race.participants.some(
        (p) => p.userId === user._id,
      );
      if (isParticipant) {
        return race._id;
      }
    }

    return null;
  },
});

export const getRace = query({
  args: { raceId: v.id("races") },
  handler: async (ctx, args) => {
    const race = await ctx.db.get(args.raceId);
    if (!race) return null;

    // Get progress for all participants
    const progress = await ctx.db
      .query("raceProgress")
      .withIndex("by_race", (q) => q.eq("raceId", args.raceId))
      .collect();

    return {
      ...race,
      progress: progress.reduce(
        (acc, p) => {
          acc[p.userId] = p;
          return acc;
        },
        {} as Record<string, (typeof progress)[0]>,
      ),
    };
  },
});

export const leaveRace = mutation({
  args: { raceId: v.id("races") },
  handler: async (ctx, args) => {
    const user = await ctx.runMutation(
      internal.users.getOrCreateAuthedUser,
      {},
    );

    const race = await ctx.db.get(args.raceId);
    if (!race) throw new Error("Race not found");

    // Remove user from participants
    const updatedParticipants = race.participants.filter(
      (p) => p.userId !== user._id,
    );

    await ctx.db.patch(args.raceId, {
      participants: updatedParticipants,
    });

    // If race is empty, handle based on status
    if (updatedParticipants.length === 0) {
      if (race.status === "waiting" || race.status === "countdown") {
        // Delete races that haven't started
        await ctx.db.delete(args.raceId);
      } else if (race.status === "racing") {
        // Mark racing races as finished if all players left
        await ctx.db.patch(args.raceId, { status: "finished" });
      }
    }
  },
});

export const startRace = mutation({
  args: { raceId: v.id("races") },
  handler: async (ctx, args) => {
    const user = await ctx.runMutation(
      internal.users.getOrCreateAuthedUser,
      {},
    );

    const race = await ctx.db.get(args.raceId);
    if (!race) throw new Error("Race not found");
    if (race.status !== "waiting") throw new Error("Race already started");

    // Check if user is participant
    const isParticipant = race.participants.some((p) => p.userId === user._id);
    if (!isParticipant) throw new Error("Not a participant");

    // Initialize progress for all participants
    for (const participant of race.participants) {
      await ctx.db.insert("raceProgress", {
        raceId: args.raceId,
        userId: participant.userId,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
      });
    }

    // Start countdown
    await ctx.db.patch(args.raceId, {
      status: "countdown",
    });

    // Schedule race start after 3 seconds
    await ctx.scheduler.runAfter(3000, api.races.startRacing, {
      raceId: args.raceId,
    });
  },
});

export const startRacing = mutation({
  args: { raceId: v.id("races") },
  handler: async (ctx, args) => {
    const race = await ctx.db.get(args.raceId);
    if (!race) throw new Error("Race not found");
    if (race.status !== "countdown") return; // Race might have been cancelled

    await ctx.db.patch(args.raceId, {
      status: "racing",
      startTime: Date.now(),
    });
  },
});

export const updateProgress = mutation({
  args: {
    raceId: v.id("races"),
    progress: v.number(),
    wpm: v.number(),
    accuracy: v.number(),
    isFinished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runMutation(
      internal.users.getOrCreateAuthedUser,
      {},
    );

    const race = await ctx.db.get(args.raceId);
    if (!race) throw new Error("Race not found");
    if (race.status !== "racing") throw new Error("Race not in progress");

    // Update or create progress
    const existing = await ctx.db
      .query("raceProgress")
      .withIndex("by_race_and_user", (q) =>
        q.eq("raceId", args.raceId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        progress: args.progress,
        wpm: args.wpm,
        accuracy: args.accuracy,
        isFinished: args.isFinished,
      });
    } else {
      await ctx.db.insert("raceProgress", {
        raceId: args.raceId,
        userId: user._id,
        progress: args.progress,
        wpm: args.wpm,
        accuracy: args.accuracy,
        isFinished: args.isFinished,
      });
    }

    // Check if all participants finished
    if (args.isFinished) {
      const allProgress = await ctx.db
        .query("raceProgress")
        .withIndex("by_race", (q) => q.eq("raceId", args.raceId))
        .collect();

      const allFinished =
        allProgress.length === race.participants.length &&
        allProgress.every((p) => p.isFinished);

      if (allFinished) {
        await ctx.db.patch(args.raceId, { status: "finished" });
      }
    }
  },
});
