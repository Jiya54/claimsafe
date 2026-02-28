const express = require("express");
const Item = require("../models/Item");

module.exports = function(upload) {
  const router = express.Router();

  // POST /api/items - Create a new found item with image upload
  router.post("/items", upload.single("image"), async (req, res) => {
    try {
      const { title, description, secretQuestion, secretAnswer, latitude, longitude } = req.body;

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (!secretQuestion || !secretQuestion.trim()) {
        return res.status(400).json({ message: "Secret question is required" });
      }
      if (!secretAnswer || !secretAnswer.trim()) {
        return res.status(400).json({ message: "Secret answer is required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      // Validate location data
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Valid latitude and longitude are required" });
      }

      const item = new Item({
        title: title.trim(),
        description: description.trim(),
        secretQuestion: secretQuestion.trim(),
        secretAnswer: secretAnswer.trim(),
        image: req.file.filename,
        location: {
          latitude: lat,
          longitude: lng
        }
      });

      await item.save();

      res.status(201).json({
        message: "Item reported successfully",
        item: {
          _id: item._id,
          title: item.title,
          description: item.description,
          secretQuestion: item.secretQuestion,
          image: item.image,
          location: item.location,
          dateFound: item.dateFound
        }
      });

    } catch (error) {
      console.error("Error saving item:", error);
      res.status(500).json({
        message: "Error saving item",
        error: error.message
      });
    }
  });

  // GET /api/items - Fetch all found items (without secret answer)
  router.get("/items", async (req, res) => {
    try {
      const items = await Item.find().sort({ dateFound: -1 });
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Error fetching items" });
    }
  });

  return router;
};