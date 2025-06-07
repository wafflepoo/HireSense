import express from "express"
import { getJobById, getJobs } from "../controllers/jobController.js";

const router = express.Router( )
//ROUTER TO GET ALL JOBS DATA
router.get('/',getJobs)


//ROUTER TO GET A SINGLE JOB BY ID
router.get('/:id',getJobById)
export default router;