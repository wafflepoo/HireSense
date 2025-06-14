import React, { useState } from "react";
import axios from "axios";

function App() {
  const [cvText, setCvText] = useState("");
  const [jobText, setJobText] = useState("");
  const [score, setScore] = useState(null);

  const handleScore = async () => {
    try {
      const res = await axios.post("http://localhost:8000/score", {
        cv_text: cvText,
        job_text: jobText,
      });
      setScore(res.data.score);
    } catch (error) {
      console.error("Erreur :", error);
      setScore("Erreur lors du calcul");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h1>🧠 Score IA de compatibilité</h1>

      <label>CV du candidat</label>
      <textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        rows={8}
        style={{ width: "100%", marginBottom: 20 }}
        placeholder="Collez ici le contenu du CV"
      />

      <label>Offre d’emploi</label>
      <textarea
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        rows={8}
        style={{ width: "100%", marginBottom: 20 }}
        placeholder="Collez ici le contenu de l’offre"
      />

      <button onClick={handleScore} style={{ padding: 10, fontSize: 16 }}>
        Générer Score
      </button>

      {score !== null && (
        <div style={{ marginTop: 30, fontSize: 20 }}>
          🎯 Score IA : <strong>{score} / 100</strong>
        </div>
      )}
    </div>
  );
}

export default App;
