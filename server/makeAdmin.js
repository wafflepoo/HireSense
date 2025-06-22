import mongoose from "mongoose";
import User from "./models/User.js";

const uri ="mongodb+srv://alissamissaoui200:yoonminlover@cluster0.7hwo88y.mongodb.net/job-portal?retryWrites=true&w=majority&appName=Cluster0"
const clerkId = "user_2yr8tr6hN3EH0jkzarjywDbgAoG"; // Replace with actual Clerk user ID


async function makeAdmin() {
  await mongoose.connect(uri);
  const user = await User.findOneAndUpdate(
    { _id:"user_2yr8tr6hN3EH0jkzarjywDbgAoG"},
    { role: "admin" },
    { new: true }
  );
  console.log("Updated user:", user);
  await mongoose.disconnect();
}

makeAdmin();