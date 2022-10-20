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
  // 1. REGISTER ROUTE : register one or more students to a specified teacher
  app.post("/api/register", async (req, res) => {
    res.send("Route 1: register one or more students to a specified teacher");
  });
  // 2. READ ROUTE : retrieve a list of students common to a given list of teachers
  app.get("/api/commonstudents", async (req, res) => {
    res.send(
      "Route 2: retrieve a list of students common to a given list of teachers"
    );
  });
  // 3. SUSPEND STUDENT ROUTE : suspend a specified student
  app.post("/api/suspend", (req, res) => {
    // res.sendStatus(204);
    res.send("Route 3: Suspend Student [POST]");
  });
  //4. ROUTE : retrieve a list of students who can receive a given notification
  app.post("/api/retrievefornotifications", (req, res) => {
    res.send("Route 4: Retrieve Notifcation");
  });
};
main();
app.listen(3000, () => {
  console.log("Server has started");
});
