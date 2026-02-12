app.post("/webhook", async (req, res) => {

  // Kirim response kosong saja
  res.status(200).end();

  try {
    const data = req.body;

    console.log("DATA MASUK:", JSON.stringify(data));

    if (!data.attachments || data.attachments.length === 0) return;

    const attachment = data.attachments[0];

    if (attachment.type !== "image") return;

    const imageUrl = attachment.url;

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

    if (result.flagged) {
      await axios.post("https://api.mylivechat.com/send_message", {
        chat_id: data.chat_id,
        text: "Maaf, foto yang Anda kirim melanggar kebijakan kami."
      });
    }

  } catch (error) {
    console.error("ERROR:", error.message);
  }
});
