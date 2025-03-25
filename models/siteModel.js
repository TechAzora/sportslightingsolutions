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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Pole = mongoose.model("Pole", poleSchema);
// ##########----------Pole Schema Ends Here----------###########

// ##########----------Device Schema(IoT Device) Starts Here----------##########
const deviceSchema = mongoose.Schema(
  {
    poleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pole",
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["Relay", "Dali", "DMX"],
    },
    status: {
      type: String,
      enum: ["ON", "OFF"],
      default: "OFF",
    },
    lights: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Light",
      },
    ],
  },
  { timestamps: true }
);
const Device = mongoose.model("Device", deviceSchema);
// ##########----------Device Schema(IoT Device) Ends Here----------##########

// ##########----------Light Schema----------##########
const lightSchema = mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    brightness: {
      type: Number,
      default: 100,
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
    subTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubTag",
    },
    status: {
      type: String,
      enum: ["ON", "OFF"],
      default: "OFF",
    },
  },
  { timestamps: true }
);
const Light = mongoose.model("Light", lightSchema);
// ##########----------Light Schema Ends Here----------##########

module.exports = {
  Site,
  Pole,
  Device,
  Light,
};
