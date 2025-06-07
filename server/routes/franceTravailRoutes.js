import express from "express";
import { getFranceTravailJobs } from "../controllers/franceTravailController.js";

const router = express.Router();

router.get("/francetravail/jobs", getFranceTravailJobs);

export default router;
