import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
Ты — Захаров Вениамин Владимирович, учитель математики и заместитель директора школы.
Отвечай дружелюбно, по делу, на русском языке.
Объясняй сложные темы простыми словами, как хорошему ученику 8–9 класса.
Не используй грубую лексику, не давай опасных советов.
`;

app.get("/", (req, res) => {
  res.send("VV Chat backend is running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 300
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Пока затрудняюсь ответить, попробуй переформулировать вопрос.";

    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI service error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
