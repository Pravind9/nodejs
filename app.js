const express = require("express");
const bodyParser = require("body-parser");
const pgdb = require("./pg-init/queries");
const apis = require("./apis/resources");
const cors = require("cors");
const path = require("path");
const dotenv = require('dotenv');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")

const publicDir = path.join(__dirname, "./public");


const app = express();

dotenv.config({ path: "./.env" })


const port = 3000;

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.set("view engine", "hbs");
app.use(cors());
app.use(express.static(publicDir));

app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json());


app.get("/", function (req, res) {
    //res.json({ info: "Node.js, Express, and Postgres API" });
    res.render("index");
});

app.get("/register", (request, response) => {
    response.render("registration")

});

app.get("/login", (request, response) => {
    response.render("login")

});

app.get("/usrMgt", (request, response) => {
    response.render("userMgt");
})

app.get("/users", pgdb.getUsers);
app.get("/users/:oid", pgdb.getUserById);
app.post("/users", pgdb.createUser)
app.put("/users/:oid", pgdb.updateUser);
app.delete("/users/:oid", pgdb.deleteUser);

app.post("/api/register", apis.registerUser);
app.post("/api/login", apis.authUser);
app.post("/api/search", apis.searchUser);


app.get("/api/user/del/:oid", apis.deleteUser);
app.get("/api/user/edit/:oid", apis.editUser);
app.post("/api/user/update", apis.updateUser);

app.use((request, response, next) => {
    const error = new Error("There is some technical issue please try later.");
    //return next(error);
    return next();

});

app.use((err, request, response, next) => {
    console.error("Error:", err.message);
    response.status(500).send("Internal Server Error!");
});



app.listen(port, () => {
    console.log(`Application running on port ${port}!`);
});