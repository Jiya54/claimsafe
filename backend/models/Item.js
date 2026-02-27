const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: String,                 // e.g. Black Wallet
  description: String,           // Public description
  hiddenDetail: String,          // Secret detail (metro card, scratch, etc.)
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