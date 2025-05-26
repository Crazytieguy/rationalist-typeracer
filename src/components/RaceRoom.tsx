import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface RaceRoomProps {
  onRaceJoined: (raceId: Id<"races">) => void;
}

export function RaceRoom({ onRaceJoined }: RaceRoomProps) {
  const waitingRaces = useQuery(api.races.listWaitingRaces);
  const createRace = useMutation(api.races.createRace);
  const joinRace = useMutation(api.races.joinRace);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<Id<"races"> | null>(null);

  const handleCreateRace = async () => {
    setIsCreating(true);
    try {
      const raceId = await createRace();
      onRaceJoined(raceId);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRace = async (raceId: Id<"races">) => {
    setIsJoining(raceId);
    try {
      await joinRace({ raceId });
      onRaceJoined(raceId);
    } finally {
      setIsJoining(null);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Join a Race</h2>
        
        <div className="divider">Create New</div>
        <button
          className="btn btn-primary"
          onClick={() => void handleCreateRace()}
          disabled={isCreating}
        >
          {isCreating && <span className="loading loading-spinner loading-xs"></span>}
          Create New Race
        </button>

        <div className="divider">Or Join Existing</div>
        <div className="space-y-2">
          {waitingRaces?.length === 0 ? (
            <p className="text-base-content/60 text-center py-4">No races available</p>
          ) : (
            waitingRaces?.map((race) => (
              <div key={race._id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                <div>
                  <p className="font-medium">
                    {race.participants.length} player{race.participants.length !== 1 ? 's' : ''} waiting
                  </p>
                  <p className="text-sm text-base-content/60">
                    Created {new Date(race._creationTime).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => void handleJoinRace(race._id)}
                  disabled={isJoining === race._id}
                >
                  {isJoining === race._id && <span className="loading loading-spinner loading-xs"></span>}
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}