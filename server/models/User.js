import mongoose from "mongoose";
import { ROLES, SUBSCRIPTION_TYPES } from "../utils/constant.js";

const userShema = new mongoose.Schema({
    _id:{type:String,required:true},
    name:{type:String,required:true},
    email:{type:String,required:true ,unique:true},
    resume:{type:String},
    image:{type:String,required:true},
    // Hivde did this
      role: { 
    type: String, 
    enum: Object.values(ROLES), 
    default: ROLES.CANDIDATE 
  },
  subscription: {
    plan: { 
      type: String, 
      enum: Object.values(SUBSCRIPTION_TYPES), 
      default: SUBSCRIPTION_TYPES.STARTER 
    },
    cvLimit: { type: Number, default: 500 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  isActive: { type: Boolean, default: true }

})

const User = mongoose.model('User',userShema)

export default User;