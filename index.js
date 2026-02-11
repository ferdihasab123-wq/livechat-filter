import express from "express";
import OpenAI from "openai";
import axios from "axios";

const app = express();
app.use(express.json());

app.get("/webhook", (req, res) => {
  const challenge = req.query.challenge;

  if (challenge) {
    return res.status(200).send(challenge);
  }

  res.status(200).send("OK");
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/webhook", async (req, res) => {
  res.status(200).send("OK"); // langsung respon cepat

  try {
    const data = req.body;

    if (data.attachments && data.attachments.length > 0) {
      const imageUrl = data.attachments[0].url;

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
        console.log("Gambar diblokir");
      } else {
        console.log("Gambar aman");
      }
    }

  } catch (err) {
    console.error(err);
  }
});

app.listen(3000, () => {
  console.log("Server jalan");
});