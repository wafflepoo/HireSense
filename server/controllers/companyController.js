//Register a new company

import Company from "../models/Company.js";
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary';
import generateToken from "../utils/generateToken.js";

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
export const loginCompany = async (req,res)=>{

}

//Get company data
export const getCompanyData = async (req,res)=>{

}

//Post a new job
export const postJob = async (req,res)=>{

}

//Get Company Job Applicants
export const getCompanyJobApplicants = async (req,res)=>{

}

//Get Company Posted Jobs
export const getCompanyPostedJobs = async (req,res)=>{

}

//Change Job Application Status
export const changeJobApplicationStatus = async (req,res)=>{

}

//Change job visibility
export const changeJobVisibility = async (req,res)=>{

}

