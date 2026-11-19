// api/chat.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body;            // Vercel parses JSON for you
  // ...call Gemini using process.env.GEMINI_API_KEY...
  res.status(200).json({ /* result */ });
};