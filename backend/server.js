const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("ClaimSafe Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

const Item = require("./models/Item");
const Claim = require("./models/Claim");

const claimRoutes = require("./routes/claimRoutes");
app.use("/api", claimRoutes);

const itemRoutes = require("./routes/itemRoutes");
app.use("/api", itemRoutes);