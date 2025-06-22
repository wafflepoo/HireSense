import express from 'express'
import { applyForJob, getAllUsers, getUserData, getUserJobApplications, updateUserResume } from '../controllers/userController.js'
import upload from '../config/multer.js'
import { protectCompany } from '../middleware/authMiddleware.js';

const router = express.Router()

//Get user Data
router.get('/user', getUserData )

//Apply for a job
router.post('/apply', applyForJob)

//Get applied jobs data
router.get('/application',  getUserJobApplications )

//Update user profile (resume)
router.post('/update-resume',upload.single('resume'),updateUserResume )

router.get('/allUser',getAllUsers)



export default router ;