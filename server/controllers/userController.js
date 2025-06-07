import Job from "../models/Job.js"
import JobApplication from "../models/JobApplication.js"
import User from "../models/User.js"
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";

// Vérifie si un ID est un ObjectId valide
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// -------- GET USER DATA --------
export const getUserData = async (req, res) => {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.json({ success: false, message: "ID utilisateur invalide." });
  }

  try {
    const user = await User.findById(userId);
    return res.json({ success: true, user: user || null });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// -------- APPLY FOR JOB --------
export const applyForJob = async (req, res) => {
    const { jobId } = req.body;
    const userId = req.auth?.userId;

    if (!userId || !isValidId(userId)) {
        return res.json({ success: false, message: "ID utilisateur invalide." });
    }

    if (!jobId || !isValidId(jobId)) {
        return res.json({ success: false, message: "ID d'offre d'emploi invalide." });
    }

    try {
        const isAlreadyApplied = await JobApplication.findOne({ jobId, userId });
        if (isAlreadyApplied) {
            return res.json({ success: false, message: "Déjà postulé." });
        }

        const jobData = await Job.findById(jobId);
        if (!jobData) {
            return res.json({ success: false, message: "Offre d'emploi introuvable." });
        }

        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            date: Date.now()
        });

        return res.json({ success: true, message: "Candidature envoyée avec succès." });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// -------- GET USER APPLICATIONS --------
export const getUserJobdApplications = async (req, res) => {
    const userId = req.auth?.userId;

    if (!userId || !isValidId(userId)) {
        return res.json({ success: false, message: "ID utilisateur invalide." });
    }

    try {
        const applications = await JobApplication.find({ userId })
            .populate("companyId", "name email image")
            .populate("jobId", "title description location category level salary")
            .exec();

        return res.json({ success: true, applications: applications || [] });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// -------- UPDATE USER RESUME --------
export const updateUserResume = async (req, res) => {
    const userId = req.auth?.userId;
    const resumeFile = req.file;

    if (!userId || !isValidId(userId)) {
        return res.json({ success: false, message: "ID utilisateur invalide." });
    }

    try {
        const userData = await User.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "Utilisateur introuvable." });
        }

        if (resumeFile) {
            const resumeUpload = await cloudinary.uploader.upload(resumeFile.path);
            userData.resume = resumeUpload.secure_url;
        } else {
            return res.json({ success: false, message: "Aucun fichier de CV reçu." });
        }

        await userData.save();
        return res.json({ success: true, message: "CV mis à jour avec succès." });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};
