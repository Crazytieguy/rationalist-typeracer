import { Id } from "../../convex/_generated/dataModel";

interface PlayerProgressProps {
  participants: Array<{ userId: Id<"users">; name: string }>;
  progress: Record<string, {
    progress: number;
    wpm: number;
    isFinished: boolean;
  }>;
  currentUserId?: Id<"users">;
}

export function PlayerProgress({ participants, progress, currentUserId }: PlayerProgressProps) {
  // Sort participants by progress
  const sortedParticipants = [...participants].sort((a, b) => {
    const progressA = progress[a.userId]?.progress || 0;
    const progressB = progress[b.userId]?.progress || 0;
    return progressB - progressA;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Race Progress</h3>
      {sortedParticipants.map((participant, index) => {
        const playerProgress = progress[participant.userId];
        const progressValue = playerProgress?.progress || 0;
        const wpm = playerProgress?.wpm || 0;
        const isFinished = playerProgress?.isFinished || false;
        const isCurrentUser = participant.userId === currentUserId;

        return (
          <div
            key={participant.userId}
            className={`p-3 rounded-lg ${isCurrentUser ? 'bg-primary/10 border border-primary' : 'bg-base-200'}`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">#{index + 1}</span>
                <span className="font-medium">
                  {participant.name}
                  {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{wpm} WPM</span>
                {isFinished && <span className="text-success font-semibold">✓ Finished</span>}
              </div>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={progressValue}
              max="100"
            ></progress>
          </div>
        );
      })}
    </div>
  );
}