import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface RaceLobbyProps {
  raceId: Id<"races">;
  participants: Array<{ userId: Id<"users">; name: string }>;
  currentUserId?: Id<"users">;
}

export function RaceLobby({ raceId, participants, currentUserId }: RaceLobbyProps) {
  const startRace = useMutation(api.races.startRace);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartRace = async () => {
    setIsStarting(true);
    try {
      await startRace({ raceId });
    } catch (error) {
      console.error("Failed to start race:", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Race Lobby</h2>
        
        <div className="divider">Players ({participants.length})</div>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className={`p-3 rounded-lg flex items-center justify-between ${
                participant.userId === currentUserId ? 'bg-primary/10 border border-primary' : 'bg-base-100'
              }`}
            >
              <span className="font-medium">
                {participant.name}
                {participant.userId === currentUserId && <span className="text-primary ml-1">(You)</span>}
              </span>
              <span className="text-sm text-base-content/60">Ready</span>
            </div>
          ))}
        </div>

        <div className="card-actions justify-center mt-6">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => void handleStartRace()}
            disabled={isStarting}
          >
            {isStarting && <span className="loading loading-spinner"></span>}
            Start Race
          </button>
        </div>

        <p className="text-center text-sm text-base-content/60 mt-2">
          Any player can start the race
        </p>
      </div>
    </div>
  );
}