const mongoose = require("mongoose");

const privacyPolicySchema = mongoose.Schema(
  {
    privacyPolicy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PrivacyPolicy", privacyPolicySchema);
