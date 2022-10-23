const express = require("express");
const router = express.Router();
const mysql = require("mysql");
require("dotenv").config();

// Connect to Database
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true,
});

// set up function to send query to database
const sendSQL = (sql) => {
  con.connect(function (err) {
    con.query(sql, function (err, result) {
      if (err) {
        const error = new Error("Error in accessing database");
        error.code = 500;
        throw error;
      }
      return Object.values(JSON.parse(JSON.stringify(result)));
    });
  });
};

router.get("/", (req, res) => {
  res.send("Connected");
});

// 1. REGISTER ROUTE : register one or more students to a specified teacher
router.post("/register", async (req, res) => {
  try {
    // get data from body
    var teacherEmail = req.body.teacher || null;
    var students = req.body.students || null;

    // check if data is valid
    if (
      teacherEmail &&
      typeof teacherEmail === "string" &&
      students &&
      Array.isArray(students)
    ) {
      // INSERT IN TEACHER (IF NOT EXIST)
      const sql = `INSERT INTO teachers (email)
        SELECT * FROM ( SELECT '${teacherEmail}') AS tmp
        WHERE NOT EXISTS (
          SELECT email FROM teachers
          WHERE email = '${teacherEmail}')
        LIMIT 1;`;
      sendSQL(sql);

      // ITERATE THROUGH THE STUDENTS LIST
      students.map((studentEmail) => {
        const sqlStudent = `INSERT INTO students ( email, is_suspended, get_notification ) 
        SELECT * FROM ( SELECT '${studentEmail}', 0, 1 ) AS tmp
          WHERE NOT EXISTS (
            SELECT email FROM students
            WHERE email = '${studentEmail}')
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
      const error = new Error("Teacher or students information missing");
      error.code = 400;
      throw error;
    }
  } catch (e) {
    res.status(e.code);
    console.log(e);
    res.send(e);
  }
});

// 2. READ ROUTE : retrieve a list of students common to a given list of teachers
router.get("/commonstudents", async (req, res) => {
  try {
    // get data from query route
    var teachers = req.query.teacher || null;

    // throw error if teacher info is missing
    if (!teachers) {
      const error = new Error("Teacher information missing");
      error.code = 406;
      throw error;
    }

    // set the query string for the teachers
    var query;
    if (Array.isArray(teachers)) {
      query = `'${teachers.join("','")}'`;
    } else {
      query = `'${teachers}'`;
      teachers = [teachers];
    }
    console.log(teachers);

    const sql = `SELECT students.email FROM teachers
            INNER JOIN students_teachers ON teachers.id = students_teachers.teacher_id
            INNER JOIN students ON students_teachers.student_id = students.id
            WHERE teachers.email IN (${query})
            GROUP BY student_id HAVING count(DISTINCT teacher_id) = ${teachers.length};`;

    con.connect(function (err) {
      con.query(sql, function (err, result) {
        if (err) {
          const error = new Error("Error accessing database");
          error.code = 404;
          throw err;
        } else {
          console.log(result);
          const response = Object.values(JSON.parse(JSON.stringify(result)));
          const students = [];
          response.map((t) => students.push(t.email));
          res.status(200);
          res.send({ students });
        }
      });
    });
  } catch (e) {
    console.log(e);
    res.status(e.code);
    res.send(e);
  }
});

// 3. SUSPEND STUDENT ROUTE : suspend a specified student
router.post("/suspend", (req, res) => {
  try {
    // get data from body
    var studentEmail = req.body.student || null;

    if (studentEmail && typeof studentEmail === "string") {
      var sql = `UPDATE students
                  SET is_suspended = 1
                  WHERE email = "${studentEmail}";`;
      sendSQL(sql);

      res.sendStatus(204);
    } else {
      res.status(400);
      res.send("Error updating student record");
    }
  } catch (e) {
    res.status(e.code);
    res.send(e);
  }
});

//4. ROUTE : retrieve a list of students who can receive a given notification
router.post("/retrievefornotifications", (req, res) => {
  try {
    // get data from body
    var teacherEmail = req.body.teacher || null;
    var notification = req.body.notification || null;

    // Separate the message and the students' email list
    var students = notification.split(" @");
    var notificationMessage = students.splice(0, 1)[0];

    var query = `'${students.join("','")}'`;

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
    res.send("Unable to retrieving data");
  }
});

// 5. EXTRA ROUTES : to create a new teacher
router.post("/teacher", async (req, res) => {
  try {
    // get data from body
    var teacherEmail = req.body.teacher || null;

    var sql = `INSERT INTO teachers (email) VALUES ('${teacherEmail}');`;
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

// 6. EXTRA ROUTE: reload table with the defaults data: teachers, students and relationship table
router.post("/reset", async (req, res) => {
  try {
    var sql = `
        SET foreign_key_checks = 0;
        TRUNCATE students_teachers;
        TRUNCATE students;
        TRUNCATE teachers;
        SET foreign_key_checks = 1;
        INSERT INTO teachers (email) VALUES ('teacherken@gmail.com'), ('teacherjon@gmail.com'), ('teacherdan@gmail.com');
        INSERT INTO students (email, is_suspended, get_notification)
          VALUES ("commonstudent1@gmail.com", 1, 1),("commonstudent2@gmail.com", 1, 1),("student_only_under_teacher_ken@gmail.com",0,0),("studentmary@gmail.com", 0, 1),("studentbob@gmail.com", 0, 1),("studentagnes@gmail.com", 0, 1),("studentmiche@gmail.com", 0, 1);
        INSERT INTO students_teachers (teacher_id, student_id) VALUES (1,1),(1,2),(1,3),(1,5),(2,1),(2,2),(3,4),(3,6),(3,7);
      `;

    con.connect(function (err) {
      con.query(sql, function (err, result) {
        console.log("Tables reloaded");
      });
    });
    res.sendStatus(204);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Error resetting database");
  }
});

// 7. EXTRA ROUTE: clear all data in table
router.post("/clear", async (req, res) => {
  try {
    var sql = `
        SET foreign_key_checks = 0;
        TRUNCATE students_teachers;
        TRUNCATE students;
        TRUNCATE teachers;
        SET foreign_key_checks = 1;
      `;

    con.connect(function (err) {
      con.query(sql, function (err, result) {
        console.log("Tables all cleared");
      });
    });
    res.sendStatus(204);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send("Error clearing tables");
  }
});

module.exports = router;
