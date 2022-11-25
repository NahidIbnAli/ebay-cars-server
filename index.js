const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());

app.get("/", async (req, res) => {
  res.send("eBay Cars server is running");
});

app.listen(port, () => {
  console.log(`eBay cars server is running on port : ${port}`);
});
