import { useState, useRef, useEffect } from "react";

const LOREM_TEXT = "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.";

export function TypingArea() {
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [isRaceStarted, setIsRaceStarted] = useState(false);
  const [isRaceCompleted, setIsRaceCompleted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Calculate WPM: (correct_chars / 5) / (time_in_minutes)
  const calculateWPM = (correctChars: number, timeElapsed: number) => {
    if (timeElapsed <= 0) return 0;
    const minutes = timeElapsed / 60000; // Convert ms to minutes
    return Math.round((correctChars / 5) / minutes);
  };

  // Update racing stats in real-time
  useEffect(() => {
    if (!isRaceStarted || !startTime) return;

    const currentTime = Date.now();
    const timeElapsed = currentTime - startTime;
    const correctChars = userInput.split("").filter((char, index) => char === LOREM_TEXT[index]).length;
    
    setWpm(calculateWPM(correctChars, timeElapsed));
  }, [userInput, startTime, isRaceStarted]);

  const hasError = () => {
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] !== LOREM_TEXT[i]) {
        return true;
      }
    }
    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Don't allow typing beyond the text length
    if (value.length > LOREM_TEXT.length) {
      return;
    }

    // If there are errors, only allow backspace (reducing length)
    if (hasError() && value.length > userInput.length) {
      return;
    }

    // Start the race on first character
    if (!isRaceStarted && value.length > 0) {
      setIsRaceStarted(true);
      setStartTime(Date.now());
    }

    setUserInput(value);
    setCurrentIndex(value.length);

    // Check for race completion
    if (value.length >= LOREM_TEXT.length && !hasError()) {
      if (!isRaceCompleted) {
        setIsRaceCompleted(true);
        setEndTime(Date.now());
      }
    }
  };

  const handleKeyDown = (_e: React.KeyboardEvent<HTMLDivElement>) => {
    // Focus the text area when any key is pressed
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const renderText = () => {
    return LOREM_TEXT.split("").map((char, index) => {
      let className = "text-base-content/50"; // default (not yet typed)
      
      if (index < userInput.length) {
        // Character has been typed
        if (userInput[index] === char) {
          className = "text-base-content"; // correct - normal text color
        } else {
          className = "text-error bg-error/20"; // incorrect
        }
      } else if (index === currentIndex) {
        className = "text-base-content bg-primary/30 border-l-2 border-primary"; // current cursor
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const validCharacterCount = userInput.split("").filter((char, index) => char === LOREM_TEXT[index]).length;
  const progress = (validCharacterCount / LOREM_TEXT.length) * 100;

  return (
    <div 
      className="card bg-base-100 shadow-xl cursor-text"
      onClick={() => textareaRef.current?.focus()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="card-body">
        <h2 className="card-title">
          {!isRaceStarted ? "Ready to Race?" : isRaceCompleted ? "Race Complete!" : "Race in Progress"}
        </h2>
        
        {/* Progress indicator */}
        <progress 
          className="progress progress-primary w-full mb-4" 
          value={progress} 
          max="100"
        ></progress>
        
        {/* Racing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Progress</div>
            <div className="stat-value text-2xl">{Math.round(progress)}%</div>
            <div className="stat-desc">{validCharacterCount}/{LOREM_TEXT.length} chars</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">WPM</div>
            <div className="stat-value text-2xl text-primary">{wpm}</div>
            <div className="stat-desc">Words per minute</div>
          </div>
        </div>

        {/* Text display - now the main interaction area */}
        <div className="bg-base-200 p-6 rounded-lg mb-4 font-mono text-xl leading-relaxed select-none min-h-[200px]">
          {renderText()}
        </div>

        {/* Fixed status area to prevent layout shift */}
        <div className="h-12 flex items-center justify-center mb-4">
          {hasError() ? (
            <div className="text-warning flex items-center gap-2">
              <span>⚠️</span>
              <span>Fix errors to continue typing</span>
            </div>
          ) : !isRaceStarted ? (
            <div className="text-base-content/60">
              Click anywhere and start typing to begin the race
            </div>
          ) : (
            <div className="text-success flex items-center gap-2">
              <span>✓</span>
              <span>Keep going! You're doing great</span>
            </div>
          )}
        </div>

        {/* Hidden textarea for input handling */}
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={handleInputChange}
          className="sr-only"
          disabled={userInput.length >= LOREM_TEXT.length}
          autoFocus
        />


        {isRaceCompleted && (
          <div className="card bg-success text-success-content mt-4">
            <div className="card-body">
              <h3 className="card-title">🎉 Race Complete!</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{wpm}</div>
                  <div className="text-sm opacity-80">Final WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {startTime && endTime ? Math.round((endTime - startTime) / 1000) : 0}s
                  </div>
                  <div className="text-sm opacity-80">Total Time</div>
                </div>
              </div>
              <div className="card-actions justify-center mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setUserInput("");
                    setCurrentIndex(0);
                    setStartTime(null);
                    setEndTime(null);
                    setWpm(0);
                    setIsRaceStarted(false);
                    setIsRaceCompleted(false);
                    textareaRef.current?.focus();
                  }}
                >
                  Race Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}