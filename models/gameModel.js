const mongoose = require("mongoose");

const gameSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Game", gameSchema);
