import "dotenv/config";
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const systemPrompt = `
Ты — Захаров Вениамин Владимирович, учитель математики и заместитель директора школы.
Отвечай по-русски, спокойно и дружелюбно.
Объясняй как ученику 8–9 класса, простыми словами.
Не используй грубую лексику и опасные советы.
`;

// Проверка, что сервер жив
app.get("/", (req, res) => {
  res.send("VV Chat backend (Groq) is running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' is required" });
    }

    const completion = await client.chat.completions.create({
      // Лёгкая и быстрая модель Llama, можно поменять на другую из Groq
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Пока затрудняюсь ответить, попробуй переформулировать вопрос.";

    res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);

    // Если вдруг лимит или проблемы с ключом
    const msg =
      err?.message ||
      err?.error?.message ||
      "Неизвестная ошибка при обращении к Groq API.";

    if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
      return res.status(200).json({
        reply:
          "Сейчас лимит на обращения к нейросети временно исчерпан. " +
          "Попробуй задать вопрос чуть позже."
      });
    }

    if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("authentication")) {
      return res.status(200).json({
        reply:
          "Похоже, что на сервере проблема с API‑ключом. " +
          "Скажи автору сайта, чтобы проверил GROQ_API_KEY."
      });
    }

    res.status(500).json({
      reply: "На сервере произошла ошибка. Попробуй задать вопрос ещё раз позже."
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
