export default function Home() {
  return (
    <main style={{ minHeight: "100vh", padding: 24, fontFamily: "monospace" }}>
      <h1>AI Clearinghouse</h1>
      <p>
        For cautious first-timers. Browse quietly. No pressure.
      </p>

      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <a href="/browse">Browse tools</a>
        <a href="/safety">Start with safety</a>
        <a href="/chat">Talk to a guide (optional)</a>
        <a href="/porch" style={{ opacity: 0.65 }}>Sanctuary</a>
      </nav>
    </main>
  );
}
