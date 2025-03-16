const mongoose = require("mongoose");

// ##########----------Site Schema Starts Here----------##########
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
    siteDocument: {
      type: String,
    },
    noOfControllers: {
      type: Number,
    },
    simCardNumber: {
      type: String,
    },
    poles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pole",
      },
    ],
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
    },
  },
  {
    timestamps: true,
  }
);

const Site = mongoose.model("Site", siteSchema);
// ##########----------Site Schema Ends Here----------##########

// ##########----------Pole Schema Starts Here----------##########
const poleSchema = mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
    },
    poleName: {
      type: String,
      trim: true,
    },
    devices: [
      {
        serialNumber: {
          type: String,
        },
        deviceType: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Pole = mongoose.model("Pole", poleSchema);
// ##########----------Pole Schema Ends Here----------##########

module.exports = {
  Site,
  Pole,
};
