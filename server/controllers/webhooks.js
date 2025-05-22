import { Webhook } from "svix";
import User from "../models/User.js";

//API Controller Function to Manage Clerk User with database

export const clerkWebhooks = async (req, res) => {
  try {
    // Create a Svix instance with clerk webhook secret
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    //Verifying Header
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-signature": req.headers["svix-signature"],
      "svix-timestamp": req.headers["svix-timestamp"],
    });

    //Getting Data from request body
    const { data, type } = req.body;

    //Switch Cases for different Events
    switch (type) {
      case "user.created": {
        //Create a new user in database
        const userData = {
            _id:data.id,
            name:data.first_name + " " + data.last_name,
            email:data.email_addresses[0].email_addresses,
            image:data.image_url,
            resume:'',
            }
      await User.create(userData)
      res.json({})
      break;

      }

      case "user.updated": {
        //Update a user in database
         const userData = {
            name:data.first_name + " " + data.last_name,
            email:data.email_addresses[0].email_addresses,
            image:data.image_url,
            
            }
            await User.findByIdAndUpdate(data.id,userData)
            res.json({})
            break;
      }

      case "user.deleted": {
        //Delete user in database
        await User.findByIdAndDelete(data.id)
        res.json({})
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.log(error.message);
    res.json({succes:false,message:'Webhooks Error'})
  }
};
