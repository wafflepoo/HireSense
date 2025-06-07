import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, index: true }, // identifiant unique API
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, required: true },
  salary: { type: String, required: false },

  date: { type: Date, required: true },
  visible: { type: Boolean, default: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
});

const Job = mongoose.model('Job', jobSchema);

export default Job