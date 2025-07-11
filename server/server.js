import './config/instrument.js'
import { protectCompany } from './middleware/authMiddleware.js';
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import * as Sentry from "@sentry/node"
import { clerkWebhooks } from './controllers/webhooks.js'
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js'
import dotenv from 'dotenv';
import jobRoutes from "./routes/jobRoutes.js"
import userRoutes from './routes/userRoutes.js'
import {clerkMiddleware} from '@clerk/express'
import franceTravailRoutes from "./routes/franceTravailRoutes.js";
import adminRoutes from './routes/adminRoutes.js';




dotenv.config();


import path from 'path';
import { fileURLToPath } from 'url';






//Initialize Express
const app = express()

//Connect to database
await connectDB()
await connectCloudinary()
//Middlewares
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())
app.use("/api", franceTravailRoutes);

//Routes
app.get('/',(req,res)=>res.send("API Working"))
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
app.post('/webhooks',clerkWebhooks)
app.use('/api/company',companyRoutes)
app.use('/api/jobs',jobRoutes)
app.use('/api/user',userRoutes)
app.use("/api/admin",adminRoutes);



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve affichage.html statiquement
app.use('/affichage.html', express.static(path.join(__dirname, '../affichage.html')));



//Port
const PORT = process.env.PORT || 5000

Sentry.setupExpressErrorHandler(app);

app.listen(PORT , ()=>{
    console.log(`Server is running on port ${PORT}`)
})