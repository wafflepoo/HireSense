import axios from "axios";
import qs from "qs";
import Job from "../models/Job.js"; // adapte le chemin

const TOKEN_URL = "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire";
const FRANCE_TRAVAIL_API_URL = "https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search";

const CLIENT_ID = "PAR_projethackathon_0a222e2d7071024ed5712a7e2ddd26e97a01b802673caaaae84e098423458e18";
const CLIENT_SECRET = "7ca2d76bb144f9193ba85e025bb487b6f95f104d333938cc10cb2a6277a36ad1";

const getAccessToken = async () => {
  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "api_offresdemploiv2 o2dsoffre",
  });

  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  const response = await axios.post(TOKEN_URL, data, { headers });
  return response.data.access_token;
};

export const getFranceTravailJobs = async (req, res) => {
  try {
    const token = await getAccessToken();
    console.log("Access Token:", token);

    const offersResponse = await axios.get(FRANCE_TRAVAIL_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: {
        motsCles: "informatique",
        departement: "75",
        range: "0-49",
      },
    });

    const jobs = offersResponse.data.resultats;

    // Boucle pour insérer / mettre à jour les jobs
    const jobsSaved = [];
for (const jobData of jobs) {
  const datePublication = jobData.datePublication ? new Date(jobData.datePublication) : new Date();

// Supposons salaryRaw peut être un objet avec { libelle: "..." } ou une string

let salaryRaw = jobData.salaire;

// Si salaire est un objet avec libelle, on récupère la chaîne libelle
if (salaryRaw && typeof salaryRaw === 'object' && salaryRaw.libelle) {
  salaryRaw = salaryRaw.libelle;
}

// On force salaryRaw en string pour appliquer la regex
if (salaryRaw && typeof salaryRaw !== 'string') {
  salaryRaw = String(salaryRaw);
}

// Extraire le premier nombre (entier ou décimal) dans la chaîne
const salaryMatch = salaryRaw ? salaryRaw.match(/\d+(\.\d+)?/) : null;

// Convertir ce nombre en float, sinon 0 si rien trouvé
const salaryNumber = salaryMatch ? parseFloat(salaryMatch[0]) : 0;

// Puis dans la création ou mise à jour du job, tu stockes salaryNumber :
const job = await Job.findOneAndUpdate(
  { externalId: jobData.id },
  {
    title: jobData.intitule,
    description: jobData.description,
    location: jobData.lieuTravail?.libelle,
    category: jobData.nomMetier,
    level: jobData.niveauEtudeCode || "Non précisé",
    salary: salaryNumber,  // <- ici tu mets le nombre extrait
    date: datePublication,
    visible: true,
    externalId: jobData.id,
  },
  { upsert: true, new: true }
);


  jobsSaved.push(job);
}


    res.json({ success: true, jobs: jobsSaved });
  } catch (error) {
    console.error("Erreur France Travail:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération ou stockage des offres",
      error: error.response?.data || error.message,
    });
  }
};
