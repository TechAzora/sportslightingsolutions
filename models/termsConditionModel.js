const mongoose = require("mongoose");

const termConditionSchema = mongoose.Schema(
  {
    termCondition: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TermCondition", termConditionSchema);
