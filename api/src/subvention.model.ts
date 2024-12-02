import { Schema, model, Document } from "mongoose";

interface ISubvention extends Document {
  key: string;
  title: string;
  detail: string;
  url: string;
}

const SubventionSchema = new Schema<ISubvention>({
  key: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, required: true },
  url: { type: String, required: true },
});

const Subvention = model<ISubvention>("Subvention", SubventionSchema);

export default Subvention;
