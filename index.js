import express from "express";
import OpenAI from "openai";
import axios from "axios";

const app = express();
app.use(express.json());

// Root test
app.get("/", (req, res) => {
  res.json({ status: "Server aktif" });
});

// ===============================
// WEBHOOK VERIFICATION (HARUS JSON)
app.get("/webhook", (req, res) => {
  const challenge = req.query.challenge;

  if (challenge) {
    return res.status(200).json({
      challenge: challenge
    });
  }

  res.status(200).json({ status: "ok" });
});

// ===============================
// OPENAI INIT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
app.post("/webhook", async (req, res) => {

  // WAJIB JSON
  res.status(200).json({ received: true });

  try {
    const data = req.body;

    console.log("DATA:", JSON.stringify(data));

    if (!data.attachments || data.attachments.length === 0) return;

    const attachment = data.attachments[0];

    if (attachment.type !== "image") return;

    const imageUrl = attachment.url;

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "input_image",
          image_url: imageUrl
        }
      ]
    });

    const result = response.results[0];

    if (result.flagged) {
      await axios.post("https://api.mylivechat.com/send_message", {
        chat_id: data.chat_id,
        text: "Maaf, foto yang Anda kirim melanggar kebijakan kami."
      });
    }

  } catch (error) {
    console.error(error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});