const mongoose = require("mongoose");

// ##########----------Tag Schema Starts Here----------##########
const tagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
    },
  },
  {
    timestamps: true,
  }
);

const Tag = mongoose.model("Tag", tagSchema);
// ##########----------Tag Schema Ends Here----------##########

// ##########----------Sub-Tag Schema Starts Here----------##########
const subTagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  },
  {
    timestamps: true,
  }
);

const SubTag = mongoose.model("SubTag", subTagSchema);
// ##########----------Pole Schema Ends Here----------##########

module.exports = {
  Tag,
  SubTag,
};
