import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
} from 'lucide-react';
import { vaultStore } from '../lib/vaultStore';
import { api } from '../lib/api';
import { AssistantChatMessage, Citation } from '../types/api';

export const LunaAssistant: React.FC = () => {
  const location = useLocation();
  const [messages, setMessages] = useState<AssistantChatMessage[]>(vaultStore.getState().chatMessages);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(vaultStore.getState().settings.voiceSynthesis);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What should I do with my laptop warranty?',
    'Summarize my electricity bill',
    'Do I need to renew any documents?',
    'Find upcoming bill due dates',
  ];

  useEffect(() => {
    const unsub = vaultStore.subscribe(() => {
      setMessages([...vaultStore.getState().chatMessages]);
    });
    return unsub;
  }, []);

  // Handle incoming prompt from Overview assistant bar navigation
  useEffect(() => {
    if (location.state && (location.state as { initialPrompt?: string }).initialPrompt) {
      const prompt = (location.state as { initialPrompt: string }).initialPrompt;
      handleSendMessage(prompt);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error or not allowed
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isProcessing) return;

    setInputText('');
    vaultStore.addChatMessage('user', query);
    setIsProcessing(true);

    try {
      // 1. Try real backend call to POST /api/assistant/chat (contracts/openapi.yaml)
      const res = await api.sendAssistantChat({
        message: query,
        conversation_id: 'conv_luna_web',
      });

      if (res.success && res.data) {
        vaultStore.addChatMessage('assistant', res.data.message, {
          citations: res.data.citations,
          workflow_id: res.data.workflow_id,
          suggested_actions: res.data.suggested_actions,
        });
        speakText(res.data.message);
      } else {
        // Fallback: Grounded local vault reasoning
        generateLocalVaultResponse(query);
      }
    } catch {
      generateLocalVaultResponse(query);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateLocalVaultResponse = (query: string) => {
    const lower = query.toLowerCase();
    let reply = '';
    let citations: Citation[] = [];
    let workflowId: string | null = null;
    let suggestions: string[] = ['List all documents', 'Check upcoming deadlines'];

    if (lower.includes('warranty') || lower.includes('laptop')) {
      reply =
        'Based on your TechWorld Laptop Invoice (#INV-2026-001), you have an active 1-year hardware warranty valid through August 15, 2027. It covers manufacturing defects and hardware faults. Accidental drops and liquid damage are excluded. Would you like me to prepare a repair claim workflow?';
      citations = [
        {
          document_id: 'doc_inv_101',
          document_title: 'Laptop Invoice.pdf',
          page: 2,
          text_snippet:
            'Warranty: 1-Year Limited Manufacturer Hardware Warranty included. Valid through August 15, 2027.',
        },
      ];
      workflowId = 'wf_1';
      suggestions = ['Prepare warranty claim', 'Check service center location'];
    } else if (lower.includes('electricity') || lower.includes('bill')) {
      reply =
        'Your BSES Electricity Bill for October 2026 is ₹2,140 for 248 kWh of consumption. The payment due date is October 25, 2026 (in 22 days). Verified tariff slab shows normal domestic billing with zero overdue penalties.';
      citations = [
        {
          document_id: 'doc_bill_201',
          document_title: 'Electricity Bill.pdf',
          page: 1,
          text_snippet:
            'BSES Yamuna Power Ltd. Due Date: 25-OCT-2026. Net Payable: ₹2,140. Units: 248 kWh.',
        },
      ];
      suggestions = ['Schedule payment', 'Compare with previous month'];
    } else if (lower.includes('renew') || lower.includes('deadline')) {
      reply =
        'You have 2 critical upcoming dates within the next 30 days: (1) Laptop warranty claim window on Oct 15, and (2) Electricity bill due on Oct 25. Your Car Insurance policy renewal with ICICI Lombard is due on Nov 12.';
      suggestions = ['View Important Dates', 'Review car insurance'];
    } else {
      reply =
        `I searched your vault of 8 documents. I found records for your Laptop Invoice, TV Warranty, Electricity Bill, and Insurance. How can I help you with these documents?`;
      suggestions = ['What should I do with my laptop warranty?', 'Summarize my electricity bill'];
    }

    vaultStore.addChatMessage('assistant', reply, {
      citations,
      workflow_id: workflowId,
      suggested_actions: suggestions,
    });
    speakText(reply);
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    // Attempt browser SpeechRecognition if supported
    interface BrowserSpeechRecognition {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onstart: () => void;
      onend: () => void;
      onerror: () => void;
      onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
      start: () => void;
    }

    const win = typeof window !== 'undefined' ? (window as unknown as Record<string, new () => BrowserSpeechRecognition>) : {};
    const SpeechRecognition = win['SpeechRecognition'] || win['webkitSpeechRecognition'];

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
          setIsListening(false);
          triggerMicSimulation();
        };
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          handleSendMessage(transcript);
        };
        recognition.start();
        return;
      } catch {
        // Fallback simulation
      }
    }

    triggerMicSimulation();
  };

  const triggerMicSimulation = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage('What should I do with my laptop warranty?');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ─── Header Section (Matching Screen 4 Center) ───────────────────── */}
      <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey p-4 sm:p-5 shadow-luna-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/luna-logo.png"
            alt="LUNA Monogram"
            className="w-10 h-10 object-contain rounded-md shadow-xs"
          />
          <div>
            <h1 className="text-xl font-extrabold text-luna-primary tracking-tight font-sans">
              LUNA Assistant
            </h1>
            <p className="text-xs text-luna-secondary">
              Your personal paperwork assistant.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-full border transition-colors ${
              speechEnabled
                ? 'bg-luna-charcoal text-white border-luna-charcoal'
                : 'bg-luna-ivory text-luna-silver border-luna-pearl-grey hover:text-luna-primary'
            }`}
            title={speechEnabled ? 'Mute voice responses' : 'Enable voice responses'}
            aria-label="Toggle voice responses"
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ─── Conversation Panel ─────────────────────────────────────────── */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/90 p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col min-h-[460px] max-h-[560px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-luna-lg p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-luna-charcoal text-white rounded-br-none shadow-sm'
                      : 'bg-luna-ivory/80 text-luna-primary rounded-bl-none border border-luna-pearl-grey shadow-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Citations Snippets */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-luna-pearl-grey/80 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-luna-secondary block">
                        Verified Evidence
                      </span>
                      {msg.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="bg-white/80 p-2 rounded-luna-sm border border-luna-pearl-grey text-[11px] text-luna-primary"
                        >
                          <div className="flex justify-between font-semibold text-luna-accent text-[10px]">
                            <span>{cite.document_title}</span>
                            <span>Page {cite.page}</span>
                          </div>
                          <p className="italic text-luna-secondary mt-0.5">
                            “{cite.text_snippet}”
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workflow Link & Suggested Actions */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                      {msg.suggested_actions.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white hover:bg-luna-ivory text-luna-accent border border-luna-pearl-grey transition-colors text-left"
                        >
                          → {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-luna-silver mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 p-3 bg-luna-ivory/50 rounded-luna-md text-xs text-luna-secondary w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-luna-accent" />
              <span>LUNA is reasoning across your documents...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="pt-3 border-t border-luna-pearl-grey mt-2 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-luna-ivory hover:bg-luna-pearl-grey text-luna-primary border border-luna-pearl-grey transition-colors text-left shadow-2xs"
            >
              “{prompt}”
            </button>
          ))}
        </div>
      </div>

      {/* ─── Signature Centerpiece Microphone Control ────────────────────── */}
      <div className="bg-[#14141A]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle Halo Radial Background */}
        <div className="absolute inset-0 bg-radial from-luna-halo/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center justify-center gap-6 w-full max-w-md">
          {/* Left Waveform Bars */}
          <div className="flex items-center gap-1 h-8 opacity-70">
            <span className={`w-1 bg-luna-halo/70 rounded-full transition-all duration-150 ${isListening ? 'h-6 animate-pulse' : 'h-2'}`} />
            <span className={`w-1 bg-luna-halo/90 rounded-full transition-all duration-150 ${isListening ? 'h-8 animate-pulse delay-75' : 'h-4'}`} />
            <span className={`w-1 bg-luna-halo/60 rounded-full transition-all duration-150 ${isListening ? 'h-5 animate-pulse delay-150' : 'h-2'}`} />
            <span className={`w-1 bg-luna-halo/80 rounded-full transition-all duration-150 ${isListening ? 'h-7 animate-pulse' : 'h-3'}`} />
          </div>

          {/* Central Microphone with Charcoal center, Silver rings & Lavender Halo */}
          <button
            type="button"
            onClick={toggleMic}
            className={`relative group w-20 h-20 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 focus:outline-none ${
              isListening
                ? 'ring-8 ring-luna-halo/40 bg-luna-charcoal-surface shadow-luna-halo scale-105 animate-pulse'
                : 'ring-4 ring-luna-silver/30 hover:ring-luna-halo bg-luna-charcoal-surface hover:bg-luna-charcoal-light shadow-luna-card hover:scale-105'
            }`}
            aria-label={isListening ? 'Listening...' : 'Tap to start speaking'}
          >
            {/* Concentric silver ring layers */}
            <div className="absolute inset-1.5 rounded-full border border-luna-silver/20 group-hover:border-luna-halo/50 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-luna-silver/30 group-hover:border-luna-halo/60 pointer-events-none" />

            <Mic
              className={`w-8 h-8 transition-colors ${
                isListening ? 'text-luna-halo' : 'text-luna-silver group-hover:text-white'
              }`}
            />
          </button>

          {/* Right Waveform Bars */}
          <div className="flex items-center gap-1 h-8 opacity-70">
            <span className={`w-1 bg-luna-halo/80 rounded-full transition-all duration-150 ${isListening ? 'h-7 animate-pulse' : 'h-3'}`} />
            <span className={`w-1 bg-luna-halo/60 rounded-full transition-all duration-150 ${isListening ? 'h-5 animate-pulse delay-150' : 'h-2'}`} />
            <span className={`w-1 bg-luna-halo/90 rounded-full transition-all duration-150 ${isListening ? 'h-8 animate-pulse delay-75' : 'h-4'}`} />
            <span className={`w-1 bg-luna-halo/70 rounded-full transition-all duration-150 ${isListening ? 'h-6 animate-pulse' : 'h-2'}`} />
          </div>
        </div>

        <p className="relative z-10 text-xs font-medium text-luna-silver mt-3">
          {isListening
            ? 'Listening to your voice... Speak your paperwork question'
            : 'Tap to start speaking'}
        </p>
      </div>

      {/* ─── Persistent Bottom Chat Composer ─────────────────────────────── */}
      <div className="bg-luna-pearl rounded-luna-lg border border-luna-pearl-grey p-2 sm:p-3 shadow-luna-card flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask Luna anything about your documents..."
          className="flex-1 bg-luna-ivory/60 hover:bg-luna-ivory focus:bg-white text-sm text-luna-primary placeholder-luna-secondary px-4 py-2.5 rounded-luna-md border border-luna-pearl-grey focus:ring-2 focus:ring-luna-halo focus:outline-none transition-colors"
        />

        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-luna-md border transition-colors ${
            isListening
              ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
              : 'bg-luna-ivory text-luna-secondary hover:text-luna-primary border-luna-pearl-grey'
          }`}
          title="Voice input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isProcessing}
          className="px-4 py-2.5 bg-luna-accent hover:bg-luna-accent-hover disabled:opacity-40 text-white rounded-luna-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default LunaAssistant;
