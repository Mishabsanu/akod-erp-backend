import mongoose from "mongoose";

const facilityChecklistSchema = new mongoose.Schema(
  {
    facilityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Facility", 
      required: true 
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkFrequency: { type: String, enum: ["Daily", "Weekly"], default: "Daily" },
    isClean: { type: Boolean, default: true },
    isWaterAvailable: { type: Boolean, default: true },
    isElectricityOK: { type: Boolean, default: true },
    photos: [{ type: String }],
    remarks: { type: String, trim: true },
    inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const FacilityChecklist = mongoose.model("FacilityChecklist", facilityChecklistSchema);
