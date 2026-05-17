import { useEffect, useRef, useState } from 'react';
import { chatbotApi } from '../api/client';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the School Portal assistant. How can I help?" },
  ]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text }]);
    setSending(true);
    try {
      const data = await chatbotApi.send(text);
      setMessages((m) => [...m, { from: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'Sorry, I could not reach the server. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-2xl text-white shadow-2xl transition hover:scale-105"
        title="Open chatbot"
        aria-label="Open chatbot"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1035]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-semibold text-white">Portal Assistant</p>
              <p className="text-xs text-white/50">Enrollment & account help</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/50 hover:text-white"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>
          <div className="max-h-80 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.text.slice(0, 8)}`}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.from === 'user'
                    ? 'ml-auto bg-blue-500/30 text-white'
                    : 'mr-auto bg-white/10 text-white/90'
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about enrollment…"
              className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/10 focus:ring-blue-400"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
