// Load requirements
const express = require("express");
const res = require("express/lib/response");
const mysql = require("mysql");
require("dotenv").config();

// create an instance of express app
let app = express();

// !! Enable processing JSON data
app.use(express.json());

// Connect to Database
var con = mysql.createConnection({
  host: "localhost",
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Database Connected!");
});

const sendSQL = (sql) => {
  con.connect(function (err) {
    con.query(sql, function (err, result) {
      return result;
    });
  });
};

const main = async () => {
  app.get("/", async (req, res) => {
    res.send("Welcome to 99Ace World");
  });
  // 1. REGISTER ROUTE : register one or more students to a specified teacher
  app.post("/api/register", async (req, res) => {
    try {
      // get data from body
      var teacherEmail = req.body.teacher || null;
      var students = req.body.students || null;

      // check if data is valid
      if (teacherEmail && students && Array.isArray(students)) {
        console.log("data ok", teacherEmail, students);

        var sql = `INSERT INTO teachers (email)
        SELECT *
        FROM (
                SELECT
                    '${teacherEmail}'
            ) AS tmp
        WHERE NOT EXISTS (
                SELECT email
                FROM teachers
                WHERE
                    email = '${teacherEmail}'
            )
        LIMIT 1;`;
        // INSERT IN TEACHER (IF NOT EXIST)
        sendSQL(sql);

        // ITERATE THROUGH THE STUDENTS LIST
        students.map((studentEmail) => {
          let sqlStudent = `INSERT INTO students (
            email, is_suspended, get_notification
          ) SELECT * FROM (
              SELECT '${studentEmail}',
                0,
                1
            ) AS tmp
          WHERE NOT EXISTS (
            SELECT email
            FROM students
            WHERE
              email = '${studentEmail}'
          )
          LIMIT 1;`;
          // INSERT STUDENT (IF NOT EXIST)
          sendSQL(sqlStudent);

          let sqlRs = `INSERT INTO
            students_teachers (teacher_id, student_id)
            SELECT t.id, s.id
            FROM teachers t, students s
            where
              t.email = '${teacherEmail}'
              and s.email = '${studentEmail}';`;
          // INSERT RELATION
          sendSQL(sqlRs);
        });

        res.sendStatus(204);
      } else {
        res.status(500);
        res.send("Bad input fields");
      }
    } catch (e) {
      res.status(500);
      console.log(e);
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
      console.log(e);
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
      console.log(e);
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

  // EXTRA ROUTES : to create a new teacher
  app.post("/api/teacher", async (req, res) => {
    try {
      // get data from body
      var teacherEmail = req.body.teacher || null;
      console.log(teacherEmail);

      var sql = `INSERT INTO teachers (email) VALUES ('${teacherEmail}');`;
      console.log(sql);
      con.connect(function (err) {
        con.query(sql, function (err, result) {
          console.log("New Teacher Inserted");
        });
      });

      res.sendStatus(204);
    } catch (e) {
      console.log(e);
      res.status(500);
      res.send("Error writing to database");
    }
  });
};
main();
app.listen(3000, () => {
  console.log("Server has started");
});
