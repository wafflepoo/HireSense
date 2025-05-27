import express from 'express'
import {
  registerCompany,
  loginCompany,
  getCompanyData,
  postJob,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  changeJobApplicationStatus,
  changeJobVisibility
} from '../controllers/companyController.js';
import upload from '../config/multer.js';

const router = express.Router()

//Register a company
router.post('/register', upload.single('image'), registerCompany )

//Company login
router.post('/login', loginCompany)

//Get company data
router.get('/company', getCompanyData)

// Post a job
router.post('/post-job', postJob)

//Get Applicants Data from company
router.get('/applicants', getCompanyJobApplicants)

//Get Company Job List
router.get('/list-jobs', getCompanyPostedJobs)

//Change Applications Status
router.post('/change-status', changeJobApplicationStatus)

//Change Applications Visibility
router.post('/change-visibility', changeJobVisibility)

export default router