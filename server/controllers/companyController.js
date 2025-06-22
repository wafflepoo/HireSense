//Register a new company

import Company from "../models/Company.js";
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary';
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import { redirect } from "next/dist/server/api-utils/index.js";
import JobApplication from "../models/JobApplication.js";

export const registerCompany = async (req,res)=>{
    const {name,email,password} = req.body
    const imageFile = req.file ;
    
    if(!name || !email || !password || !imageFile){
        return res.json({success:false , message:"Missing Details"})
    }
    try{
        const companyExists = await Company.findOne({email})
        if(companyExists){
            return res.json({success:false , message:"Company already exists"})
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        const company = await Company.create({
            name,
            email,
            password:hashedPassword,
            image:imageUpload.secure_url
        })
       const token = generateToken(company._id)
res.json({
  success: true,
  message: "Company created successfully",
  token,
  company
})

    
    }
    catch(error){
        res.json({succes:false,message:error.message})

    }


    

}

//Company login
export const loginCompany = async (req, res) => {
    const { email, password } = req.body;

    try {
        const company = await Company.findOne({ email });
        if (!company) {
            return res.json({ success: false, message: "Invalid Email or Password" });
        }

        const isMatch = await bcrypt.compare(password, company.password);
        if (isMatch) {
            return res.json({
                success: true,
                message: "Company logged in successfully",
                token: generateToken(company._id),
            });
        } else {
            return res.json({ success: false, message: "Invalid Email or Password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//Get company data
export const getCompanyData = async (req, res) => {
  try {
    const company = req.company;
    if (!company) {
      return res.status(404).json({ success: false, message: "Entreprise non trouvée" });
    }
    res.json({ success: true, company });  // success au lieu de succes
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


//Post a new job
export const postJob = async (req,res)=>{
    const {title,description,location,salary,level,category} = req.body
    const companyId = req.company._id
    
    try{
        const newJob = new Job({
            title,
            description,
            location,
            salary,
            companyId,
            date:Date.now(),
            level,
            category
        })
        await newJob.save()
        res.json({success:true,newJob})

    }
catch (error) {
    res.json({success:false,message:error.message})

}

}

//Get Company Job Applicants

export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Trouve les candidatures pour les jobs de cette entreprise
    const applications = await JobApplication.find({ company_id: companyId })
      .populate('user_id', 'name image resume')
      .populate('job_id', 'title location category level salary description')
      .exec();

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("Erreur lors de la récupération des candidatures :", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


//Get Company Posted Jobs

export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Récupérer tous les jobs de cette entreprise
    const jobs = await Job.find({ companyId });

    // Pour chaque job, compter combien d'applications existent
    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await JobApplication.countDocuments({ job_id: job._id });
        return {
          ...job._doc,
          applicants: applicationCount,
        };
      })
    );

    console.log("✅ Jobs préparés avec nombre  de candidatures :", jobsData);

    res.status(200).json({
      success: true,
      jobsData,
    });

  } catch (error) {
    console.error("❌ Erreur dans getCompanyPostedJobs :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des offres avec candidatures.",
    });
  }
};

//Change Job Application Status
export const changeJobApplicationStatus = async (req,res)=>{

    try {

         const {id , status} = req.body
    //find job application and update status
    await JobApplication.findOneAndUpdate({_id:id},{status})
    res.json({success:true , message:'Status Changed'})

        
    } catch (error) {
        res.json({success:false , message:error.message})
        
    }

   
}

//Change job visibility
export const changeJobVisibility = async (req,res)=>{
    try {
        const {id}=req.body
        const companyId = req.company._id
        const job=await Job.findById(id)
        if(job.companyId.toString() === companyId.toString()){
            job.visible = !job.visible
        }
        await job.save()
        res.json({succes:true,job})
        
    } catch (error) {
        res.json({succes:false,message:error.message})
        
    }

}

