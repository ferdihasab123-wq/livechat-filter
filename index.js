import express from "express";
import OpenAI from "openai";
import axios from "axios";

const app = express();
app.use(express.json());

// ===============================
// ROOT CHECK
app.get("/", (req, res) => {
  res.send("Server aktif");
});

// ===============================
// WEBHOOK VERIFICATION (WAJIB PLAIN TEXT)
app.get("/webhook", (req, res) => {
  const challenge = req.query.challenge;

  if (challenge) {
    // HARUS plain text, bukan JSON
    return res.status(200).send(challenge);
  }

  res.status(200).send("Webhook ready");
});

// ===============================
// OPENAI INIT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// TERIMA DATA DARI LIVECHAT
app.post("/webhook", async (req, res) => {

  // WAJIB respon cepat supaya tidak timeout
  res.status(200).json({ received: true });

  try {
    const data = req.body;

    console.log("DATA MASUK:", JSON.stringify(data));

    // Cek attachment
    if (!data.attachments || data.attachments.length === 0) {
      console.log("Tidak ada attachment");
      return;
    }

    const attachment = data.attachments[0];

    if (attachment.type !== "image") {
      console.log("Bukan gambar");
      return;
    }

    const imageUrl = attachment.url;
    console.log("Cek gambar:", imageUrl);

    // ===============================
    // MODERATION OPENAI
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        }
      ]
    });

    const result = response.results[0];
    console.log("HASIL MODERATION:", result);

    // ===============================
    // JIKA MELANGGAR
    if (result.flagged) {

      console.log("Gambar melanggar kebijakan");

      await axios.post("https://api.mylivechat.com/send_message", {
        chat_id: data.chat_id,
        text: "Maaf, foto yang Anda kirim melanggar kebijakan kami."
      });

    } else {
      console.log("Gambar aman");
    }

  } catch (error) {
    console.error("ERROR:", error.message);
  }
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server jalan di port", PORT);
});
