const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  },
  claimerAnswer: String,         // Claimer's answer to the secret question
  confidenceScore: Number,        // % match (0-100)
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Claim", claimSchema);