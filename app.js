const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const validatePassword = (password) => {
  return password.length < 5;
};

app.post("/register", async (request, response) => {
  const { userName, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUser = `
    SELECT * FROM user WHERE username = "${userName}"`;
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    const createUser = `
    INSERT INTO user(username,name,password,gender,location)
    VALUES ("${userName}","${name}","${password}", "${gender}", "${location}")
    `;
    if (validatePassword(password)) {
      await db.run(createUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Username already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password);
    if (isPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUser = `
    SELECT * FROM user WHERE username = "${username}"`;
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPassword === true) {
      if (validatePassword(password)) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatePassword = `
            UPDATE user
            SET password = "${hashedPassword}
            WHERE username = "${username}"`;
        const newPassword = await db.run(updatePassword);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
