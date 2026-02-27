const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

router.post("/items", async (req, res) => {
  try {
    const { title, description, hiddenDetail, latitude, longitude } = req.body;

    const item = new Item({
      title,
      description,
      hiddenDetail,
      location: {
        latitude,
        longitude
      }
    });

    await item.save();

    res.status(201).json({
      message: "Item saved successfully",
      item
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving item",
      error
    });
  }
});


// GET all found items
router.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ dateFound: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching items" });
  }
});

module.exports = router;