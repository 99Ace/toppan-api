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
      // if (err) {
      //   res.status(500);
      //   res.send("Error writing to database");
      // }
      return Object.values(JSON.parse(JSON.stringify(result)));
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

        const sql = `INSERT INTO teachers (email)
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
          const sqlStudent = `INSERT INTO students (
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

          const sqlRs = `INSERT INTO
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
      // console.log(teachers);
      var query = `'${teachers.join("','")}'`;
      // console.log(query);

      const sql = `SELECT students.email
        FROM teachers
          INNER JOIN students_teachers ON teachers.id = students_teachers.teacher_id
          INNER JOIN students ON students_teachers.student_id = students.id
        WHERE
          teachers.email IN (${query})
        GROUP BY student_id
        HAVING
          count(DISTINCT teacher_id) = ${teachers.length};`;

      con.connect(function (err) {
        con.query(sql, function (err, result) {
          if (err) {
            res.status(404);
            res.send("Error retrieving data");
          }
          const response = Object.values(JSON.parse(JSON.stringify(result)));
          const students = [];
          response.map((t) => students.push(t.email));

          res.status(200);
          res.send({ students });
        });
      });

      // res.status(200);
      // res.send(
      //   "Route 2: retrieve a list of students common to a given list of teachers"
      // );
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
      var studentEmail = req.body.student || null;

      if (studentEmail) {
        var sql = `UPDATE students
                  SET is_suspended = 1
                  WHERE
                  email = "${studentEmail}";`;
        sendSQL(sql);

        res.sendStatus(204);
      } else {
        res.status(500);
        res.send("Error updating student record");
      }
    } catch (e) {
      res.status(500);
      res.send("Error updating student record");
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

      var query = `'${students.join("','")}'`;
      console.log(query);

      const sql = `SELECT students.email
                  FROM teachers
                      INNER JOIN students_teachers ON teachers.id = students_teachers.teacher_id
                      INNER JOIN students ON students_teachers.student_id = students.id
                  WHERE (
                        teachers.email = "${teacherEmail}"
                        OR students.email IN (${query})
                      )
                      AND students.get_notification = 1
                      AND students.is_suspended = 0
                  GROUP BY student_id
                  HAVING
                      count(DISTINCT student_id) = 1;`;
      console.log(sql);
      con.connect(function (err) {
        con.query(sql, function (err, result) {
          if (err) {
            res.status(404);
            res.send("Error retrieving data");
          }
          const response = Object.values(JSON.parse(JSON.stringify(result)));
          const recipents = [];
          response.map((t) => recipents.push(t.email));

          res.status(200);
          res.send({ recipents });
        });
      });
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
