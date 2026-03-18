export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};

    return res.status(200).json({
      reply: `You said: ${message || ""}`,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
