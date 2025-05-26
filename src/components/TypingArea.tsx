import { useState, useRef, useEffect } from "react";

const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export function TypingArea() {
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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

    setUserInput(value);
    setCurrentIndex(value.length);
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
        <h2 className="card-title">Practice Typing</h2>
        
        {/* Progress indicator */}
        <progress 
          className="progress progress-primary w-full mb-4" 
          value={progress} 
          max="100"
        ></progress>
        
        <div className="text-sm text-base-content/70 mb-4">
          Progress: {Math.round(progress)}% ({validCharacterCount}/{LOREM_TEXT.length} characters)
          {hasError() && (
            <span className="text-error ml-2">
              - Fix errors to continue
            </span>
          )}
        </div>

        {/* Text display - now the main interaction area */}
        <div className="bg-base-200 p-6 rounded-lg mb-4 font-mono text-xl leading-relaxed select-none min-h-[200px]">
          {renderText()}
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

        <div className="text-sm text-base-content/60 text-center">
          Click anywhere and start typing
        </div>

        {userInput.length >= LOREM_TEXT.length && !hasError() && (
          <div className="alert alert-success mt-4">
            <span>🎉 Congratulations! You've completed the text!</span>
          </div>
        )}
      </div>
    </div>
  );
}