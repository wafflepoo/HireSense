import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema({
    user_id: {type:String , ref:'User',required:true},
    company_id: {type:mongoose.Schema.Types.ObjectId , ref:'Company',required:true},
    job_id: {type:mongoose.Schema.Types.ObjectId , ref:'Job',required:true},
    status: {type:String,default:'pending'},
    date: {type:Number,required:true},
})

const JobApplication = mongoose.model('JobApplication' , JobApplicationSchema)

export default JobApplication