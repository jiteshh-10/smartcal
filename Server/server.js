const express = require("express");
require('dotenv').config(); // Add this line at the top of the file

const mongoose = require("mongoose");
const cors = require("cors");
const historyRoutes = require("./historyRoutes");
const bodyParser = require('body-parser');


const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use("/api/history", historyRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Calculator History API");
});

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/calculatorHistory", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
