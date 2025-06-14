const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/score", async (req, res) => {
  const { cv_text, job_text } = req.body;

  try {
    const response = await axios.post("http://localhost:8000/score", {
      cv_text,
      job_text,
    });
    res.json({ score: response.data.score });
  } catch (error) {
    console.error("Erreur dans l'appel à l'API Python :", error.message);
    res.status(500).json({ error: "Erreur lors du calcul du score" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend Node.js démarré sur http://localhost:${PORT}`);
});
