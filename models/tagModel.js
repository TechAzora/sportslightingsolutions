const mongoose = require("mongoose");

const tagSchema = mongoose.Schema(
  {
    stadiumType: {
      type: String,
    },
    tags: {
      type: [String],
    },
    subTags: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tag", tagSchema);
