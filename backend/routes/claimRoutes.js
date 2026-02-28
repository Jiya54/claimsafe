const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const calculateConfidence = require("../utils/matchLogic");

router.post("/claim", async (req, res) => {
  try {
    const { itemId, claimerAnswer } = req.body;

    // Validate required fields
    if (!itemId || !claimerAnswer) {
      return res.status(400).json({
        confidence: 0,
        message: "Missing required fields: itemId, claimerAnswer"
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        confidence: 0,
        message: "Item not found"
      });
    }

    // Validate that item has a secret answer
    if (!item.secretAnswer) {
      return res.status(500).json({
        confidence: 0,
        message: "Item does not have a verification question"
      });
    }

    // Calculate confidence by comparing claimer's answer with the founder's secret answer
    const confidence = calculateConfidence(
      item.secretAnswer,
      claimerAnswer
    );

    const claim = new Claim({
      itemId,
      claimerAnswer,
      confidenceScore: confidence
    });

    await claim.save();

    return res.json({
      confidence,
      message: confidence >= 60
        ? "High confidence match!"
        : "Low confidence, claim rejected"
    });

  } catch (err) {
    console.error("Claim route error:", err);
    return res.status(500).json({
      confidence: 0,
      message: "Internal server error"
    });
  }
});

// GET ranked claims for an item
router.get("/claims/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;

    const claims = await Claim.find({ itemId })
      .sort({ confidenceScore: -1 });

    return res.json(claims);

  } catch (err) {
    console.error("Claims fetch error:", err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

// GET secret question for an item (before claiming)
router.get("/items/:itemId/question", async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    if (!item.secretQuestion) {
      return res.status(400).json({
        message: "Item does not have a verification question"
      });
    }

    // Return only the question, NOT the answer
    res.json({
      secretQuestion: item.secretQuestion
    });

  } catch (err) {
    console.error("Question fetch error:", err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Reveal location if valid claim exists
router.get("/claims/:itemId/location", async (req, res) => {
  try {
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
      location: item.location,
      latitude: item.location?.latitude,
      longitude: item.location?.longitude
    });

  } catch (err) {
    console.error("Location route error:", err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

module.exports = router;