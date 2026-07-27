'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'copilot';
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'What should I do to complete the Objects of Issue?',
  'How can I improve my Business Model documentation?',
  'What are the key requirements for Risk Factors?',
  'Tell me about SEBI requirements for management disclosures',
  'How do I address pending review documents?',
];

const COPILOT_RESPONSES: Record<string, string> = {
  'objects-of': 'For the Objects of Issue, you need to clearly define the primary objective (such as capital raising), secondary objectives, and how proceeds will be used. Ensure alignment with your financial statements.',
  'business-model': 'A strong business model section should cover your revenue streams, customer segments, value proposition, cost structure, and competitive advantages. Include specific examples from your operations.',
  'risk-factors': 'Identify and document all material risks including business, financial, market, and regulatory risks. For each risk, explain potential impact and mitigation strategies.',
  'sebi': 'SEBI requires detailed disclosures on management team qualifications, compensation structure, related party transactions, and governance policies. Review the SEBI master circular for specifics.',
  'pending': 'Documents in pending-review status need action. Check the comments from the merchant banker and resubmit updated versions with supporting evidence.',
  'default': 'Thank you for your question. In a production environment, Dwaar would analyze your specific situation and provide personalized guidance. For now, I recommend reviewing the DRHP Master Circular from SEBI.',
};

export function DwaarCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Dwaar Copilot. I can help you navigate DRHP preparation, answer questions about workstreams, and provide guidance on SEBI requirements. What would you like to know?',
      sender: 'copilot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate copilot response
    setTimeout(() => {
      let responseText = COPILOT_RESPONSES['default'];

      // Simple keyword matching for demo
      if (text.toLowerCase().includes('object')) {
        responseText = COPILOT_RESPONSES['objects-of'];
      } else if (text.toLowerCase().includes('business') || text.toLowerCase().includes('model')) {
        responseText = COPILOT_RESPONSES['business-model'];
      } else if (text.toLowerCase().includes('risk')) {
        responseText = COPILOT_RESPONSES['risk-factors'];
      } else if (text.toLowerCase().includes('sebi') || text.toLowerCase().includes('requirement')) {
        responseText = COPILOT_RESPONSES['sebi'];
      } else if (text.toLowerCase().includes('pending') || text.toLowerCase().includes('review')) {
        responseText = COPILOT_RESPONSES['pending'];
      }

      const copilotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'copilot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, copilotMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-40"
        aria-label="Open Dwaar Copilot"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 w-full max-w-sm h-96 bg-card border border-border rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-accent text-accent-foreground px-6 py-4 flex items-center gap-3">
            <Sparkles size={20} />
            <div>
              <h3 className="font-semibold">Dwaar Copilot</h3>
              <p className="text-xs opacity-90">DRHP Preparation Assistant</p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-semibold mb-3">Suggested questions:</p>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="w-full text-left text-xs p-2 rounded border border-border hover:bg-muted transition-colors text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Ask Dwaar..."
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
