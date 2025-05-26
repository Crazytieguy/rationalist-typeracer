import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const LOREM_TEXT = "The quick brown fox jumps over the lazy dog.";

interface MultiplayerTypingAreaProps {
  raceId: Id<"races">;
  raceStatus: "waiting" | "countdown" | "racing" | "finished";
  startTime?: number;
  existingProgress?: {
    progress: number;
    wpm: number;
    accuracy: number;
    isFinished: boolean;
    _id?: any;
    _creationTime?: any;
    raceId?: any;
    userId?: any;
  };
  onProgressUpdate?: (progress: number, wpm: number) => void;
}

export function MultiplayerTypingArea({
  raceId,
  raceStatus,
  startTime,
  existingProgress,
  onProgressUpdate,
}: MultiplayerTypingAreaProps) {
  // Restore state from existing progress
  const initialCompletedChars = existingProgress
    ? Math.floor((existingProgress.progress / 100) * LOREM_TEXT.length)
    : 0;
  const [userInput, setUserInput] = useState(
    LOREM_TEXT.substring(0, initialCompletedChars),
  );
  const [completedChars, setCompletedChars] = useState(initialCompletedChars);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [wpm, setWpm] = useState(existingProgress?.wpm || 0);
  const [isFinished, setIsFinished] = useState(
    existingProgress?.isFinished || false,
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdownTime, setCountdownTime] = useState(3);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const updateProgress = useMutation(api.races.updateProgress);

  // Auto-focus when race starts
  useEffect(() => {
    if (raceStatus === "racing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [raceStatus]);

  // Countdown timer
  useEffect(() => {
    if (raceStatus === "countdown") {
      setCountdownTime(3);
      const interval = setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [raceStatus]);

  // Calculate WPM and elapsed time
  useEffect(() => {
    if (raceStatus !== "racing" || !startTime || isFinished) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      setElapsedTime(elapsed);

      if (completedChars > 0) {
        const minutes = elapsed / 60;
        const words = completedChars / 5; // Standard: 5 chars = 1 word
        const currentWpm = Math.round(words / minutes);
        setWpm(currentWpm);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [raceStatus, startTime, completedChars, isFinished]);

  // Update progress in database
  useEffect(() => {
    if (raceStatus !== "racing") return;

    const progress = (completedChars / LOREM_TEXT.length) * 100;
    const accuracy = 100; // Simplified for MVP - errors are blocked

    void updateProgress({
      raceId,
      progress,
      wpm,
      accuracy,
      isFinished,
    });

    onProgressUpdate?.(progress, wpm);
  }, [
    completedChars,
    wpm,
    isFinished,
    raceStatus,
    raceId,
    updateProgress,
    onProgressUpdate,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (raceStatus !== "racing" || isFinished) return;

    const newInput = e.target.value;

    // Don't allow typing if there are errors that need fixing
    if (errors.size > 0 && newInput.length > userInput.length) {
      return;
    }

    // Handle backspace
    if (newInput.length < userInput.length) {
      const deletedPosition = userInput.length - 1;

      // Remove error if we're deleting an error character
      if (errors.has(deletedPosition)) {
        const newErrors = new Set(errors);
        newErrors.delete(deletedPosition);
        setErrors(newErrors);
      }

      // Update completed chars if we're backspacing into completed section
      if (deletedPosition < completedChars) {
        setCompletedChars(deletedPosition);
      }

      setUserInput(newInput);
      return;
    }

    // Handle new character
    const position = newInput.length - 1;
    const typedChar = newInput[position];
    const targetChar = LOREM_TEXT[position];

    if (typedChar === targetChar) {
      // Correct character
      if (position === completedChars) {
        setCompletedChars(position + 1);
      }

      // Check if finished
      if (position === LOREM_TEXT.length - 1) {
        setIsFinished(true);
      }
    } else {
      // Wrong character
      const newErrors = new Set(errors);
      newErrors.add(position);
      setErrors(newErrors);
    }

    setUserInput(newInput);
  };

  const renderText = () => {
    return LOREM_TEXT.split("").map((char, index) => {
      let className = "";

      if (index < completedChars && !errors.has(index)) {
        className = "text-success";
      } else if (errors.has(index)) {
        className = "bg-error text-error-content";
      } else if (
        index === userInput.length &&
        raceStatus === "racing" &&
        !isFinished
      ) {
        className = "bg-primary text-primary-content animate-pulse";
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const progress = (completedChars / LOREM_TEXT.length) * 100;

  return (
    <div className="space-y-4 relative">
      {/* Countdown Overlay */}
      {raceStatus === "countdown" && (
        <div className="absolute inset-0 bg-base-100/90 z-10 flex items-center justify-center">
          <div className="text-9xl font-bold animate-pulse">
            {countdownTime > 0 ? (
              <span className="text-warning">{countdownTime}</span>
            ) : (
              <span className="text-success">GO!</span>
            )}
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          {raceStatus === "racing" && !isFinished && (
            <>
              <span className="text-lg">{wpm} WPM</span>
              <span className="text-lg">{elapsedTime.toFixed(1)}s</span>
            </>
          )}
          {isFinished && (
            <span className="text-2xl font-bold text-success">
              Finished! {wpm} WPM in {elapsedTime.toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <progress
        className="progress progress-primary w-full"
        value={progress}
        max="100"
      ></progress>

      {/* Text Display */}
      <div
        className="text-2xl leading-relaxed font-mono p-6 bg-base-200 rounded-lg cursor-text select-none"
        onClick={() => inputRef.current?.focus()}
      >
        {renderText()}
      </div>

      {/* Hidden Input */}
      <textarea
        ref={inputRef}
        value={userInput}
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Type the text shown above"
        disabled={raceStatus !== "racing" || isFinished}
        autoFocus
      />

      {/* Instructions */}
      {raceStatus === "waiting" && (
        <p className="text-center text-base-content/60">
          Waiting for race to start...
        </p>
      )}
      {raceStatus === "racing" && !isFinished && errors.size > 0 && (
        <p className="text-center text-error">
          Fix errors to continue (use backspace)
        </p>
      )}
    </div>
  );
}
