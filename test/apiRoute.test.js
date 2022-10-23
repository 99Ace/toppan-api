const app = require("../app");
const request = require("supertest");

// Testing root route
describe("Test root route", () => {
  it("should return status 200", async () => {
    const res = await request(app).get("/api");
    expect(res.statusCode).toBe(200);
  });
});

// Route 1 : register students under a teacher
// a. CHECK SUCCESS STATUS CODE
describe("Route 1a: check success posting when body is passed correctly", () => {
  it("should return status 204", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        teacher: "teacherken@gmail.com",
        students: ["studentjon@gmail.com", "studenthon@gmail.com"],
      });
    expect(res.statusCode).toBe(204);
  });
});

// b. CHECK ERROR : INCOMPLETE OR EMPTY BODY
describe("Route 1b: check for error when incomplete or empty body", () => {
  // sample errors cases
  const errBodySample = [
    // missing student info
    { teacher: "teacherken@gmail.com" },
    // wrong teacher data format
    {
      teacher: ["teacherken@gmail.com"],
      students: ["studentjon@gmail.com", "studenthon@gmail.com"],
    },
    // missing teacher info
    { students: ["studentjon@gmail.com", "studenthon@gmail.com"] },
    // empty body
    {},
  ];

  it("should return status 400", async () => {
    for (body of errBodySample) {
      const res = await request(app).post("/api/register").send(body);
      expect(res.statusCode).toBe(400);
    }
  });
});

// Route 2 : retrieve common students under one or more teachers
// a. CHECK SUCCESS ROUTE
describe("Route 2a: check success retrieval of students listing", () => {
  it("should return status 200, json data, body.student to be defined", async () => {
    // sample query string
    const queryString = [
      // one teacher
      "commonstudents?teacher=teacherken%40gmail.com",
      // two teacher
      "commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjon%40gmail.com",
    ];

    for (query of queryString) {
      const res = await request(app).get("/api/" + query);
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toEqual(
        expect.stringContaining("json")
      );
      expect(res.body.students).toBeDefined();
    }
  });
});

// b. CHECK ERROR ROUTE
describe("Route 2b: check for error when empty query", () => {
  it("should return status 406, error message", async () => {
    const res = await request(app).get("/api/commonstudents");
    expect(res.statusCode).toBe(406);
  });
});
