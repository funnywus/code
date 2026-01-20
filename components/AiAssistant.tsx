import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Copy, Check, Loader2, Bot, ChevronDown, Eraser } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";

// Sub-component for Prompt Blocks with Copy functionality
const PromptBlock: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
      <div className="flex justify-between items-center px-3 py-1.5 bg-white/5 border-b border-white/5">
         <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Master Style Prompt</span>
         <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors">
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
         </button>
      </div>
      <div className="p-3 text-[10px] text-zinc-300 font-mono leading-relaxed break-words bg-zinc-950/30">
        {content}
      </div>
    </div>
  );
};

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: "👋 您好！我是您的首席 AI 视觉导演。\n\n告诉我您的**产品**是什么，您想打造一套**亚马逊品牌套图**还是一支**完整的商业视频**？\n\n我会运用顶级设计思维，为您规划 3 套完整的视觉体系（包含光影、色调、运镜逻辑），并提供可一键复制的**大师级风格指令**。" 
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const initChat = () => {
    if (!chatRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `You are a world-class AI Visual Director and Design Strategy Expert (Top-tier Art Director).

YOUR GOAL: Provide a comprehensive, holistic visual direction for the user's product.
- If the user wants a **Video**, define the "Cinematic Universe" (Color grading, Camera movement philosophy, Pacing, Lighting).
- If the user wants **Amazon Images**, define the "Brand Visual Identity" (Layout, Background logic, Lighting consistency, Prop selection).

DO NOT generate descriptions for just one single frame. You must plan the **ENTIRE** set.

WHEN THE USER ASKS FOR PLANNING:
1. Analyze their product and intent.
2. Propose exactly 3 DISTINCT Creative Directions (e.g., "Nordic Minimalism", "Cyberpunk Future", "Warm Lifestyle", "Studio Industrial").
3. For EACH direction, strictly follow this structure:
    *   **Theme Title**: A catchy, professional title.
    *   **Design Rationale**: Why this style converts sales? (Design Thinking).
    *   **Visual Atmosphere**: Describe the global Lighting, Color Palette, and Textures.
    *   **Execution Strategy**:
        *   *For Video*: Describe the rhythm (e.g., "Slow motion macro -> Fast dynamic cuts"), music vibe, and camera lens choices.
        *   *For Images*: Describe the composition rules (e.g., "Golden ratio, clean background"), prop styling, and consistent elements.
    *   **MASTER STYLE PROMPT**: A powerful, consolidated block of style keywords (NO specific scene content) that acts as a "Style Filter" for the AI. This prompt should be applied to ALL shots/images to maintain consistency.
        *   *Format*: Wrap this inside a code block: \`\`\`prompt ... \`\`\`.
        *   *Content*: English keywords focusing on style, renderer (e.g., Unreal Engine 5), lighting (e.g., Volumetric), camera (e.g., 85mm lens), and color grading.

LANGUAGE:
-   Explanations: Chinese (Professional, Artistic, Persuasive).
-   Prompts inside code blocks: English (Optimized for Gemini/Midjourney).
          `,
        },
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    initChat();
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    try {
      let fullResponse = "";
      // Add a temporary empty message for streaming
      setMessages(prev => [...prev, { role: 'model', text: "" }]);
      
      const result = await chatRef.current!.sendMessageStream({ message: userMsg });
      
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].text = fullResponse;
            return newMsgs;
          });
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "⚠️ 连接中断，请检查 API Key 或网络设置。" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([{ 
      role: 'model', 
      text: "已重置思维链。请告诉我新的产品需求，我将为您重新规划视觉体系！" 
    }]);
    chatRef.current = null; // Reset session
  };

  // Renderer for text with code blocks (prompts)
  const renderMessageContent = (text: string) => {
    // Split by code blocks ```...```
    const parts = text.split(/```/g);
    
    return parts.map((part, index) => {
      // Even indices are regular text, Odd indices are code blocks (usually)
      if (index % 2 === 0) {
        return <span key={index} className="whitespace-pre-wrap leading-relaxed">{part}</span>;
      } else {
        // Clean up the language identifier (e.g., "prompt" or "text")
        const content = part.replace(/^(prompt|text|json)\n/, "").trim();
        return <PromptBlock key={index} content={content} />;
      }
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div className={`pointer-events-auto bg-[#0a0a0c] border border-amber-500/30 rounded-[32px] shadow-2xl overflow-hidden transition-all duration-500 ease-in-out origin-bottom-right flex flex-col ${isOpen ? 'w-[420px] h-[650px] opacity-100 mb-4 translate-y-0' : 'w-[0px] h-[0px] opacity-0 translate-y-10'}`}>
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-white/5 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Director's Copilot</h3>
                <p className="text-[10px] text-zinc-500 font-bold">AI 视觉导演 (Strategy Mode)</p>
              </div>
           </div>
           <div className="flex items-center gap-1">
             <button onClick={handleClear} className="p-2 text-zinc-500 hover:text-white transition-colors" title="重置对话"><Eraser size={16} /></button>
             <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-colors"><ChevronDown size={20} /></button>
           </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent bg-black/40">
           {messages.map((msg, i) => (
             <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-5 rounded-2xl text-sm leading-6 ${
                  msg.role === 'user' 
                    ? 'bg-amber-600 text-white rounded-tr-sm shadow-lg shadow-amber-900/20' 
                    : 'bg-zinc-800/90 text-zinc-200 rounded-tl-sm border border-white/5 shadow-xl backdrop-blur-md'
                }`}>
                   {msg.role === 'model' ? renderMessageContent(msg.text) : msg.text}
                </div>
             </div>
           ))}
           {isThinking && (
             <div className="flex justify-start">
                <div className="bg-zinc-800/50 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-2">
                   <Loader2 className="animate-spin text-amber-500" size={14} />
                   <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Designing Visual System...</span>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-white/5 shrink-0">
           <div className="relative">
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="例如：这款电竞耳机，我需要一套赛博朋克风格的 Listing 视觉方案..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none h-14 scrollbar-none leading-relaxed"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="absolute right-2 top-2 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl disabled:opacity-50 disabled:bg-zinc-700 transition-all shadow-lg"
              >
                {isThinking ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </button>
           </div>
           <div className="text-[9px] text-zinc-600 text-center mt-2 font-mono">Powered by Gemini 3 Pro Preview</div>
        </div>
      </div>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 group border-2 border-white/20 relative z-[1000]"
        >
          <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-bounce" />
        </button>
      )}
    </div>
  );
};

export default AiAssistant;
