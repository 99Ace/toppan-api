// Load requirements
const express = require("express");
const mysql = require("mysql");
require("dotenv").config;

// create an instance of express app
let app = express();

// !! Enable processing JSON data
app.use(express.json());

const main = async () => {
  app.get("/", async (req, res) => {
    res.send("Welcome to 99Ace World");
  });

  
};
main();
app.listen(3000, () => {
  console.log("Server has started");
});
