const mongoose = require("mongoose");

// ##########----------Tag Schema Starts Here----------##########
const tagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    subTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubTag",
      },
    ],
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
