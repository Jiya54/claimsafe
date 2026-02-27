const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const calculateConfidence = require("../utils/matchLogic");

router.post("/claim", async (req, res) => {
  const { itemId, claimantDescription } = req.body;

  const item = await Item.findById(itemId);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  const confidence = calculateConfidence(
    item.hiddenDetail,
    claimantDescription
  );

  const claim = new Claim({
    itemId,
    claimantDescription,
    confidenceScore: confidence
  });

  await claim.save();

  res.json({
    confidence,
    message: confidence >= 60
      ? "High confidence owner"
      : "Low confidence, claim rejected"
  });
});


// GET ranked claims for an item
router.get("/claims/:itemId", async (req, res) => {
  const { itemId } = req.params;

  const claims = await Claim.find({ itemId })
    .sort({ confidenceScore: -1 });

  res.json(claims);
});

// Reveal location if valid claim exists
router.get("/claims/:itemId/location", async (req, res) => {
  const { itemId } = req.params;

  const topClaim = await Claim.findOne({ itemId })
    .sort({ confidenceScore: -1 });

  if (!topClaim || topClaim.confidenceScore < 60) {
    return res.status(403).json({
      message: "No valid claim yet"
    });
  }

  const item = await Item.findById(itemId);

  res.json({
    location: item.location
  });
});

module.exports = router;