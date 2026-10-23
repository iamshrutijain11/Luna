import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Send } from 'lucide-react';

interface LunaAssistantBarProps {
  onPromptSelect?: (prompt: string) => void;
}

export const LunaAssistantBar: React.FC<LunaAssistantBarProps> = ({ onPromptSelect }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const suggestedPrompts = [
    'What should I do with my laptop warranty?',
    'Summarize my electricity bill',
    'Which documents are missing for my claim?',
    'Show my upcoming deadlines',
  ];

  const handleLaunchPrompt = (promptText: string) => {
    if (onPromptSelect) {
      onPromptSelect(promptText);
    } else {
      navigate('/assistant', { state: { initialPrompt: promptText } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      handleLaunchPrompt(query.trim());
    }
  };

  const toggleMic = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        handleLaunchPrompt('What should I do with my laptop warranty?');
      }, 1800);
    }
  };

  return (
    <div className="bg-[#14141A]/95 backdrop-blur-xl text-white rounded-2xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden">
      {/* Subtle Lunar Ambient Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-luna-halo/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left: Assistant Identity and Header */}
        <div className="flex items-center gap-4 text-center md:text-left">
          {/* Signature Microphone with Charcoal center, Silver rings & Lavender Halo */}
          <button
            type="button"
            onClick={toggleMic}
            className={`relative group w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
              isListening
                ? 'ring-4 ring-luna-halo bg-luna-charcoal-surface shadow-luna-halo animate-pulse'
                : 'ring-2 ring-luna-silver/30 hover:ring-luna-halo bg-luna-charcoal-surface hover:bg-luna-charcoal-light'
            }`}
            aria-label={isListening ? 'Listening...' : 'Tap to speak with Luna'}
            title="Tap to speak with Luna"
          >
            {/* Subtle rotating silver ring */}
            <div className="absolute inset-0 rounded-full border border-luna-silver/20 group-hover:border-luna-halo/50" />
            <Mic
              className={`w-6 h-6 transition-colors ${
                isListening ? 'text-luna-halo scale-110' : 'text-luna-silver group-hover:text-white'
              }`}
            />
          </button>

          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h3 className="font-semibold text-white text-base tracking-tight">
                LUNA Assistant
              </h3>
            </div>
            <p className="text-xs text-luna-silver mt-1">
              Ask questions across your warranties, invoices, bills, and active claims.
            </p>
          </div>
        </div>

        {/* Right: Quick input query bar */}
        <div className="w-full md:w-auto flex-1 max-w-md">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luna anything about your paperwork..."
              className="w-full pl-4 pr-11 py-2.5 bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-luna-silver focus:ring-2 focus:ring-luna-halo focus:border-luna-halo transition-all"
            />
            <button
              type="button"
              onClick={() => query.trim() && handleLaunchPrompt(query.trim())}
              disabled={!query.trim()}
              className="absolute right-1.5 p-1.5 text-luna-silver hover:text-white disabled:opacity-30 disabled:hover:text-luna-silver transition-colors rounded-lg hover:bg-white/10"
              aria-label="Send prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLaunchPrompt(prompt)}
                className="text-[11px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-full px-2.5 py-0.5 text-luna-silver hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LunaAssistantBar;
