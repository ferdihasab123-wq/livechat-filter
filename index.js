import express from "express";
import OpenAI from "openai";
import axios from "axios";

const app = express();
app.use(express.json());

// ===============================
// ROOT CHECK (optional)
app.get("/", (req, res) => {
  res.send("Server aktif");
});

// ===============================
// WEBHOOK VERIFICATION (WAJIB PLAIN TEXT)
app.get("/webhook", (req, res) => {
  const challenge = req.query.challenge;

  if (challenge) {
    return res.status(200).send(challenge); 
  }

  res.status(200).send("OK");
});

// ===============================
// OPENAI INIT
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// RECEIVE MESSAGE FROM MY LIVECHAT
app.post("/webhook", async (req, res) => {
  
  // WAJIB respon cepat supaya tidak timeout
  res.status(200).send("OK");

  try {
    const data = req.body;

    console.log("DATA MASUK:", JSON.stringify(data));

    // cek ada attachment atau tidak
    if (!data.attachments || data.attachments.length === 0) {
      return;
    }

    const attachment = data.attachments[0];

    // hanya proses jika tipe image
    if (attachment.type !== "image") {
      return;
    }

    const imageUrl = attachment.url;

    console.log("Cek gambar:", imageUrl);

    // ===============================
    // KIRIM KE OPENAI MODERATION
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

    console.log("Hasil moderation:", result);

    // ===============================
    // JIKA GAMBAR SENSITIF
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