import { Webhook } from "svix";
import User from "../models/User.js";
import { CV_LIMITS, ROLES, SUBSCRIPTION_TYPES } from "../utils/constant.js";

// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {
    console.log("✅ Webhook reçu : ", JSON.stringify(req.body, null, 2));

    // Create a Svix instance with Clerk webhook secret
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verifying Header
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-signature": req.headers["svix-signature"],
      "svix-timestamp": req.headers["svix-timestamp"],
    });

    // Getting Data from request body
    const { data, type } = req.body;

    console.log("📦 Type d'événement :", type);
    console.log("📧 Email reçu :", data?.email_addresses?.[0]?.email_address);

    switch (type) {
      case "user.created": {
        const email = data?.email_addresses?.[0]?.email_address;

        if (!email) {
          console.error("❌ Email introuvable dans le webhook !");
          return res
            .status(400)
            .json({
              success: false,
              message: "Email manquant dans Clerk data",
            });
        }

        const userData = {
          _id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          email,
          image: data.image_url,
          role: data.public_metadata?.role || ROLES.CANDIDATE,
          subscription: {
            plan:
              data.public_metadata?.subscription?.plan ||
              SUBSCRIPTION_TYPES.STARTER,
            cvLimit:
              CV_LIMITS[
                data.public_metadata?.subscription?.plan ||
                  SUBSCRIPTION_TYPES.STARTER
              ],
            startDate: new Date(),
          },
          resume: "",
        };

        console.log("📝 Création user avec :", userData);

        await User.create(userData);
        res.json({ success: true });
        break;
      }

      case "user.updated": {
        const email = data?.email_addresses?.[0]?.email_address;

        const userData = {
          name: `${data.first_name} ${data.last_name}`,
          email,
          image: data.image_url,
           role: data.public_metadata?.role,
          'subscription.plan': data.public_metadata?.subscription?.plan,
          'subscription.cvLimit': CV_LIMITS[data.public_metadata?.subscription?.plan]
        };

        console.log("✏️ Mise à jour user :", data.id, userData);

        await User.findByIdAndUpdate({_id: data.id}, userData);
        res.json({ success: true });
        break;
      }

      case "user.deleted": {
        console.log("🗑 Suppression user :", data.id);
        await User.findByIdAndDelete({_id:data.id});
        res.json({ success: true });
        break;
      }

      default:
        console.log("⚠️ Type d'événement non géré :", type);
        res
          .status(400)
          .json({ success: false, message: "Événement non supporté" });
        break;
    }
  } catch (error) {
    console.error("❌ Erreur Webhook :", error.message);
    res.status(500).json({ success: false, message: "Erreur Webhook" });
  }
};
