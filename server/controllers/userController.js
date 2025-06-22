import { use } from "react";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import { v2 as cloudinary } from 'cloudinary';

// Add to userController.js
// -------- GET ALL USERS (ADMIN ONLY) --------
export const getAllUsers = async (req, res) => {
  try {
    // Verify admin role from Clerk metadata

    // Get users with sensitive fields excluded
    const users = await User.find({})
      .select('-password -__v -refreshToken')
      .lean();

    console.log(`✅ [getAllUsers] ${users.length} utilisateurs récupérés`);
    return res.json({ 
      success: true, 
      users 
    });

  } catch (error) {
    console.error("❌ [getAllUsers] Erreur:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erreur serveur" 
    });
  }
};

// -------- GET USER DATA --------
export const getUserData = async (req, res) => {
  const auth = req.auth?.();
  const userId = auth?.userId;

  console.log("📌 [getUserData] req.auth:", req.auth);

  if (!userId) {
    console.warn("⚠️ [getUserData] ID utilisateur invalide");
    return res.json({ success: false, message: "ID utilisateur invalide." });
  }

  try {
    const user = await User.findOne({ _id: userId });
    
    console.log("✅ [getUserData] Utilisateur récupéré:", user);
    return res.json({ success: true, user: user || null });
  } catch (error) {
    console.error("❌ [getUserData] Erreur:", error);
    return res.json({ success: false, message: error.message });
  }
};

// -------- APPLY FOR JOB --------
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const auth = req.auth?.();
  const userId = auth?.userId;

  console.log("📌 [applyForJob] req.auth:", req.auth);
  console.log("📌 [applyForJob] jobId:", jobId);

  if (!userId) {
    console.warn("⚠️ [applyForJob] ID utilisateur invalide");
    return res.json({ success: false, message: "ID utilisateur invalide." });
  }

  if (!jobId) {
    console.warn("⚠️ [applyForJob] ID d'offre d'emploi invalide");
    return res.json({ success: false, message: "ID d'offre d'emploi invalide." });
  }

  try {
    const isAlreadyApplied = await JobApplication.findOne({ job_id: jobId, user_id: userId });

    if (isAlreadyApplied) {
      console.log("ℹ️ [applyForJob] Déjà postulé.");
      return res.json({ success: false, message: "Déjà postulé." });
    }

    const jobData = await Job.findById(jobId);
    if (!jobData) {
      console.warn("⚠️ [applyForJob] Offre d'emploi introuvable.");
      return res.json({ success: false, message: "Offre d'emploi introuvable." });
    }

  await JobApplication.create({
  company_id: jobData.companyId,
  user_id: userId,
  job_id: jobId,
  date: Date.now()
});


    console.log("✅ [applyForJob] Candidature envoyée.");
    return res.json({ success: true, message: "Candidature envoyée avec succès." });
  } catch (error) {
    console.error("❌ [applyForJob] Erreur:", error);
    return res.json({ success: false, message: error.message });
  }
};

// -------- GET USER APPLICATIONS --------
export const getUserJobApplications = async (req, res) => {
  const auth = req.auth?.();
  const userId = auth?.userId;

  console.log("📌 [getUserJobdApplications] req.auth:", req.auth);

  if (!userId) {
    console.warn("⚠️ [getUserJobdApplications] ID utilisateur invalide");
    return res.json({ success: false, message: "ID utilisateur invalide." });
  }

  try {
    const applications = await JobApplication.find({ user_id : userId })
      .populate("company_id", "name email image")
.populate("job_id", "title description location category level salary")

      .exec();

    console.log("✅ [getUserJobdApplications] Candidatures récupérées:", applications.length);
    return res.json({ success: true, applications: applications || [] });
  } catch (error) {
    console.error("❌ [getUserJobdApplications] Erreur:", error);
    return res.json({ success: false, message: error.message });
  }
};

// -------- UPDATE USER RESUME --------
export const updateUserResume = async (req, res) => {
  const auth = req.auth?.();
  const userId = auth?.userId;

  const resumeFile = req.file;

  console.log("📌 [updateUserResume] req.auth:", req.auth);
  console.log("📌 [updateUserResume] Fichier reçu:", resumeFile?.originalname || "Aucun");

  if (!userId) {
    console.warn("⚠️ [updateUserResume] ID utilisateur invalide ou manquant !");
    return res.json({ success: false, message: "ID utilisateur invalide ou manquant." });
  }

  try {
    const userData = await User.findOne({ _id: userId });
    if (!userData) {
      console.warn("⚠️ [updateUserResume] Utilisateur introuvable.");
      return res.json({ success: false, message: "Utilisateur introuvable." });
    }

    if (!resumeFile) {
      console.warn("⚠️ [updateUserResume] Aucun fichier reçu.");
      return res.json({ success: false, message: "Aucun fichier de CV reçu." });
    }

    const resumeUpload = await cloudinary.uploader.upload(resumeFile.path);
    userData.resume = resumeUpload.secure_url;

    await userData.save();
    console.log("✅ [updateUserResume] CV mis à jour.");
    return res.json({ success: true, message: "CV mis à jour avec succès." });
  } catch (error) {
    console.error("❌ [updateUserResume] Erreur:", error);
    return res.json({ success: false, message: error.message });
  }
};
