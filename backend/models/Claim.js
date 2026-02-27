const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  },
  claimantDescription: String,   // What user types
  confidenceScore: Number,        // % match
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Claim", claimSchema);