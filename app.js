// Load requirements
const express = require("express");
const apiRoute = require("./routes/apiRoute");

// create an instance of express app
let app = express();

// !! Enable processing JSON data
app.use(express.json());

// Load in Routes
app.use("/api", apiRoute);

//  main = async () => {
app.get("/", async (req, res) => {
  res.send("Welcome to 99Ace World");
});

module.exports = app;
