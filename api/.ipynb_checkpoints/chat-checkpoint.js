import { useState } from "react";
import ErrorBanner from "./ErrorBanner";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");

  async function sendMessage(e) {
    e.preventDefault(); // prevent page reload
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setMessages([...messages, { role: "user", content: input }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setInput(""); // clear input box
    }
  }

  return (
    <div>
      <ErrorBanner error={error} />

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
        {loading && <div className="typing-indicator">Bot is typing...</div>}
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
