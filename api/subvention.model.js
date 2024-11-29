import { Schema, model } from "mongoose";


// Create a Schema for the "subventions" collection
const SubventionSchema = new Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, required: true },
  url: { type: String, required: true },
});

// Create and export the Mongoose model
const Subvention = model("Subvention", SubventionSchema);

export default Subvention;
