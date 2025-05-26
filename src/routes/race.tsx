import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { RaceRoom } from "../components/RaceRoom";
import { RaceLobby } from "../components/RaceLobby";
import { MultiplayerTypingArea } from "../components/MultiplayerTypingArea";
import { PlayerProgress } from "../components/PlayerProgress";

export const Route = createFileRoute("/race")({
  component: RacePage,
});

function RacePage() {
  const [currentRaceId, setCurrentRaceId] = useState<Id<"races"> | null>(null);
  const [hasLeftRace, setHasLeftRace] = useState(false);
  const activeRaceId = useQuery(api.races.getActiveRaceForUser);
  const race = useQuery(api.races.getRace, currentRaceId ? { raceId: currentRaceId } : "skip");
  const currentUser = useQuery(api.users.getAuthenticatedUser);
  const leaveRaceMutation = useMutation(api.races.leaveRace);

  // Auto-join active race on page load (unless user explicitly left)
  useEffect(() => {
    if (activeRaceId && !currentRaceId && !hasLeftRace) {
      setCurrentRaceId(activeRaceId);
    }
  }, [activeRaceId, currentRaceId, hasLeftRace]);

  const handleLeaveRace = async () => {
    if (currentRaceId) {
      await leaveRaceMutation({ raceId: currentRaceId });
      setCurrentRaceId(null);
      setHasLeftRace(true);
    }
  };

  return (
    <Authenticated>
      <div className="flex flex-col gap-8 w-full py-8">
        <h1 className="text-4xl font-bold text-center">Multiplayer Typeracer</h1>
        
        <div className="max-w-6xl mx-auto w-full px-4">
          {!currentRaceId ? (
            <RaceRoom onRaceJoined={(raceId) => {
              setCurrentRaceId(raceId);
              setHasLeftRace(false);
            }} />
          ) : !race ? (
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {race.status === "waiting" ? (
                  <RaceLobby
                    raceId={currentRaceId}
                    participants={race.participants}
                    currentUserId={currentUser?._id}
                  />
                ) : (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <MultiplayerTypingArea
                        raceId={currentRaceId}
                        raceStatus={race.status}
                        startTime={race.startTime}
                        existingProgress={currentUser?._id ? race.progress[currentUser._id] : undefined}
                      />
                    </div>
                  </div>
                )}

                {/* Leave Race Button */}
                <div className="text-center">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => void handleLeaveRace()}
                  >
                    Leave Race
                  </button>
                </div>
              </div>

              {/* Sidebar - Player Progress */}
              <div className="space-y-6">
                <div className="card bg-base-200">
                  <div className="card-body">
                    <PlayerProgress
                      participants={race.participants}
                      progress={race.progress}
                      currentUserId={currentUser?._id}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Authenticated>
  );
}