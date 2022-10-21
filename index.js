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
    try {
      // get data from body
      var { teacher: teacherEmail, students } = req.body;
      console.log(teacherEmail, students);

      res.sendStatus(204);
    } catch (e) {
      console.log(err);
      res.status(500);
      res.send("Error writing to database");
    }
  });
  // 2. READ ROUTE : retrieve a list of students common to a given list of teachers
  app.get("/api/commonstudents", async (req, res) => {
    try {
      // get data from query route
      var teachers = req.query.teacher || null;

      teachers && !Array.isArray(teachers) ? (teachers = [teachers]) : null;
      console.log(teachers);

      res.status(200);
      res.send(
        "Route 2: retrieve a list of students common to a given list of teachers"
      );
    } catch (e) {
      console.log(err);
      res.status(404);
      res.send("Error retrieving data");
    }
  });
  // 3. SUSPEND STUDENT ROUTE : suspend a specified student
  app.post("/api/suspend", (req, res) => {
    try {
      // get data from body
      var { student: studentEmail } = req.body;
      console.log(studentEmail);

      res.sendStatus(204);
      // res.send("Route 3: Suspend Student [POST]");
    } catch (e) {
      console.log(err);
      res.status(404);
      res.send("Error retrieving data");
    }
  });
  //4. ROUTE : retrieve a list of students who can receive a given notification
  app.post("/api/retrievefornotifications", (req, res) => {
    try {
      // get data from body
      var teacherEmail = req.body.teacher || null;
      var notification = req.body.notification || null;

      console.log(teacherEmail);
      // Separate the message and the students' email list
      var students = notification.split(" @");
      var notificationMessage = students.splice(0, 1)[0];
      console.log(notificationMessage, students);

      res.sendStatus(204);
      // res.send("Route 4: Retrieve Notifcation");
    } catch (e) {
      console.log(e);
      res.status(404);
      res.send("Error retrieving data");
    }
  });
};
main();
app.listen(3000, () => {
  console.log("Server has started");
});
