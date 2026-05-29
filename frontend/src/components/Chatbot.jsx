import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotApi } from '../api/client';

/* ── Bot keyframe styles (injected once) ── */
const BOT_STYLES = `
  @keyframes bot-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes bot-blink { 0%,88%,100%{transform:scaleY(1)} 93%{transform:scaleY(0.07)} }
  @keyframes bot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.35)} }
`;

const BUBBLE_MSGS = [
  "Need help? Ask me! 👋",
  "Enrollment is open!",
  "Check the summary 📊",
  "I'm here to assist!",
  "Got questions? 💬",
];

// Expanded pool of suggestions
const ALL_SUGGESTIONS = [
  "How do I enroll?",
  "Are there available sections?",
  "Show my subjects",
  "What is the deadline?",
  "Where is the registrar?",
  "How do I drop a subject?",
  "What are the payment methods?",
  "Is there a discount for cash?",
  "Who is my adviser?",
  "Check my balance"
];

/* ══ Bot FAB — always visible in bottom-right ══ */
function BotFAB({ open, onToggle, isDay }) {
  const [bubble, setBubble] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(true);

  useEffect(() => {
    if (open) return;
    const t = setInterval(() => {
      setBubbleVisible(false);
      setTimeout(() => {
        setBubble(b => (b + 1) % BUBBLE_MSGS.length);
        setBubbleVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(t);
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
      <AnimatePresence>
        {!open && bubbleVisible && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className={`relative mb-3 max-w-[180px] rounded-2xl rounded-br-sm px-3.5 py-2 text-xs font-semibold shadow-lg pointer-events-none
              ${isDay ? 'bg-white text-slate-700 shadow-slate-200' : 'bg-[#1a3a6e] text-white shadow-black/40'}`}>
            {BUBBLE_MSGS[bubble]}
            <span className="absolute -right-2 bottom-2 w-0 h-0" style={{
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: isDay ? '8px solid white' : '8px solid #1a3a6e',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        title={open ? 'Close assistant' : 'Open assistant'}
        className="relative flex flex-col items-center cursor-pointer select-none focus:outline-none"
      >
        <div className="relative w-14 h-14">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex flex-col items-center justify-center shadow-2xl"
            style={{ animation: open ? 'none' : 'bot-float 2.8s ease-in-out infinite' }}>
            {open ? (
              <span className="text-white text-xl font-bold leading-none">✕</span>
            ) : (
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ animation: 'bot-blink 3.5s ease-in-out infinite' }} />
                <div className="w-2.5 h-2.5 rounded-full bg-white" style={{ animation: 'bot-blink 3.5s ease-in-out infinite 0.12s' }} />
              </div>
            )}
          </div>
          {!open && <>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-white/60 rounded-full" />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-300 shadow"
              style={{ animation: 'bot-pulse 1.4s ease-in-out infinite' }} />
          </>}
        </div>
      </motion.button>
    </div>
  );
}

/* ══ Main Chatbot ══ */
export default function Chatbot({ isDay = false }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [activeChips, setActiveChips] = useState(() => ALL_SUGGESTIONS.slice(0, 4));

  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the School Portal assistant. How can I help you today?" },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, sending]);

  const handleChipClick = (suggestion) => {
    send(null, suggestion);

    setActiveChips(prev => {
      const remaining = prev.filter(item => item !== suggestion);
      const unusedCandidates = ALL_SUGGESTIONS.filter(item => !prev.includes(item));

      if (unusedCandidates.length > 0) {
        const randomNewChip = unusedCandidates[Math.floor(Math.random() * unusedCandidates.length)];
        return [...remaining, randomNewChip];
      }
      return remaining;
    });
  };

  const send = async (e, directText = null) => {
    if (e) e.preventDefault();

    const text = directText || input.trim();
    if (!text || sending) return;

    setInput('');
    setMessages(m => [...m, { from: 'user', text }]);
    setSending(true);

    try {
      const data = await chatbotApi.send(text);
      setMessages(m => [...m, { from: 'bot', text: data.reply || data.response || data.message || 'Got it!' }]);
    } catch {
      setMessages(m => [...m, { from: 'bot', text: 'Sorry, I couldn\'t reach the server. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const panelBg = isDay ? 'bg-white/95 border-slate-200' : 'bg-[#0d1f3c]/97 border-white/10';
  const headBg = isDay ? 'border-slate-100' : 'border-white/10';
  const msgUser = isDay ? 'bg-sky-500/20 text-sky-900' : 'bg-blue-500/30 text-white';
  const msgBot = isDay ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white/90';
  const inputCls = isDay
    ? 'flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-400'
    : 'flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400';
  const sendBtn = isDay
    ? 'rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 transition'
    : 'rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition';

  const chipCls = isDay
    ? 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
    : 'border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20';

  return (
    <>
      <style>{BOT_STYLES}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed bottom-28 right-6 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${panelBg}`}
          >
            <div className={`flex items-center gap-3 border-b px-4 py-3 ${headBg}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${isDay ? 'text-slate-800' : 'text-white'}`}>Portal Assistant</p>
                <p className={`text-xs ${isDay ? 'text-emerald-500' : 'text-emerald-400'}`}>● Online</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className={`text-xl leading-none transition px-1 ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/50 hover:text-white'}`}>
                ×
              </button>
            </div>

            <div className="max-h-80 flex-1 flex flex-col space-y-2.5 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                    ${msg.from === 'user' ? `ml-auto rounded-br-sm ${msgUser}` : `mr-auto rounded-bl-sm ${msgBot}`}`}>
                  {msg.text}
                </motion.div>
              ))}

              {sending && (
                <div className={`mr-auto max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm ${msgBot}`}>
                  <span className="inline-flex gap-1.5 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
              <div ref={bottomRef} className="h-1" />
            </div>

            {/* Changed to flex-wrap! The buttons will now stack onto a second line if they run out of space. */}
            <div className="flex flex-wrap gap-2 px-4 pb-3 shrink-0">
              <AnimatePresence mode="popLayout">
                {activeChips.map((suggestion) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={suggestion}
                    onClick={() => handleChipClick(suggestion)}
                    disabled={sending}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${chipCls}`}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            <form onSubmit={send} className={`flex gap-2 border-t p-3 shrink-0 ${headBg}`}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { send(e); } }}
                placeholder="Ask about enrollment…"
                className={inputCls}
                disabled={sending}
                autoFocus
              />
              <button type="submit" disabled={sending || !input.trim()} className={sendBtn}>
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <BotFAB open={open} onToggle={() => setOpen(o => !o)} isDay={isDay} />
    </>
  );
}