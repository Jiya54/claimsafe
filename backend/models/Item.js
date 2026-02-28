const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: String,                 // e.g. Black Wallet
  description: String,           // Public description
  secretQuestion: String,        // Question only founder knows (e.g. "What color is the zipper?")
  secretAnswer: String,          // Answer to verify (e.g. "blue")
  image: String,                 // Image filename
  location: {
    latitude: Number,
    longitude: Number
  },
  dateFound: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Item", itemSchema);