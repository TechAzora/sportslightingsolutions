const mongoose = require("mongoose");

const siteSchema = mongoose.Schema(
  {
    siteName: {
      type: String,
      trim: true,
    },
    siteImage: {
      type: String,
    },
    department: {
      type: String,
      trim: true,
    },
    siteLocation: {
      type: String,
    },
    isDimmable: {
      type: Boolean,
    },
    electricRates: {
      type: String,
    },
    noOfPoles: {
      type: Number,
    },
    siteDocument: {
      type: String,
    },
    stadiumType: {
      type: String,
      enum: ["cricket", "football"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Site", siteSchema);
