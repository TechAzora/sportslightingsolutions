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
    perLightConsumptionRate: {
      type: String,
    },
    stadiumType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
    siteDocument: {
      type: String,
    },
    noOfControllers: {
      type: Number,
    },
    simCardNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Site", siteSchema);
