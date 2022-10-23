const app = require("../app");
const request = require("supertest");

// Testing root route
describe("Test root route", () => {
  it("should return status 200", async () => {
    const res = await request(app).get("/api");
    expect(res.statusCode).toBe(200);
  });
});

// Route 1 :
describe("Route 1: register students", () => {
  //CHECK STATUS CODE
  it("should return status 204", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        teacher: "teacherken@gmail.com",
        students: ["studentjon@gmail.com", "studenthon@gmail.com"],
      });
    expect(res.statusCode).toBe(204);
  });
  // CHECK ERROR : INCOMPLETE OR EMPTY BODY

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
