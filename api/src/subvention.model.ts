import { Schema, model, Document } from "mongoose";

// Define an interface for the Subvention document
interface ISubvention extends Document {
  key: string;
  title: string;
  detail: string;
  url: string;
}

// Create a Schema for the "subventions" collection
const SubventionSchema = new Schema<ISubvention>({
  key: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, required: true },
  url: { type: String, required: true },
});

// Create and export the Mongoose model
const Subvention = model<ISubvention>("Subvention", SubventionSchema);

export default Subvention;
