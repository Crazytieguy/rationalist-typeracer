import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema defines your data model for the database.
// For more information, see https://docs.convex.dev/database/schema
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
  }).index("by_userId", ["userId"]),

  races: defineTable({
    status: v.union(v.literal("waiting"), v.literal("countdown"), v.literal("racing"), v.literal("finished")),
    participants: v.array(v.object({
      userId: v.id("users"),
      name: v.string(),
    })),
    startTime: v.optional(v.number()),
  }).index("by_status", ["status"]),

  raceProgress: defineTable({
    raceId: v.id("races"),
    userId: v.id("users"),
    progress: v.number(), // 0-100 percentage
    wpm: v.number(),
    accuracy: v.number(),
    isFinished: v.boolean(),
  })
    .index("by_race", ["raceId"])
    .index("by_race_and_user", ["raceId", "userId"]),
});
