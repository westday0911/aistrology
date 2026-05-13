import mongoose, { Schema, model, models } from "mongoose";

const ChartSchema = new Schema({
  // User Identification (if logged in, otherwise can be session-based)
  userId: { type: String, default: "anonymous" },
  
  // Birth Input Data
  input: {
    birthDate: { type: String, required: true },
    birthTime: { type: String, required: true },
    location: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Calculated Astronomical Data
  results: [
    {
      name: String,
      longitude: Number,
      sign: String,
      degree: String,
      house: String,
      isRetrograde: Boolean
    }
  ],
  
  meta: {
    houses: [Number],
    ascendant: Number,
    mc: Number
  },

  // AI Interpretations (The snapshot)
  aiAnalysis: {
    summary: String,
    planets: Schema.Types.Mixed, // Stores specific interpretations for each planet
    houses: Schema.Types.Mixed,  // Stores specific interpretations for each house
    generatedAt: { type: Date, default: Date.now }
  },

  // Questions from the Soul Quest Modal
  questions: [String],

  // Professional Reports (Paid)
  reports: {
    yearly: {
      content: Schema.Types.Mixed,
      generatedAt: Date,
      isPaid: { type: Boolean, default: false }
    },
    love: {
      content: Schema.Types.Mixed,
      generatedAt: Date,
      isPaid: { type: Boolean, default: false }
    },
    career: {
      content: Schema.Types.Mixed,
      generatedAt: Date,
      isPaid: { type: Boolean, default: false }
    },
    full: {
      content: Schema.Types.Mixed,
      generatedAt: Date,
      isPaid: { type: Boolean, default: false }
    }
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Use existing model if available (for Next.js HMR)
const Chart = models.Chart || model("Chart", ChartSchema);

export default Chart;
