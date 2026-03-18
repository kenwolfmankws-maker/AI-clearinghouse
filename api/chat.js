export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({ message: "API is alive" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
