// Vercel 서버리스 프록시 — 클라이언트에서 받은 프롬프트를 Anthropic API로 전달.
// API 키는 Vercel 환경변수(ANTHROPIC_API_KEY)로만 존재하고 클라이언트에 절대 노출되지 않음.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages required" });
      return;
    }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",                                  // 서버에서 모델 고정 (요청값 무시)
        max_tokens: Math.min(Number(body.max_tokens) || 1500, 2000),
        messages
      })
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
