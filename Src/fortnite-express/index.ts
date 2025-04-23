import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app : Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
  });

app.get("/lobby", (req, res) => {
    res.render("lobby", {
        title: "Lobby",
        style: "lobby"
    })
});

app.get("/locker", (req, res) => {
    res.render("locker", {
        title: "Locker",
        style: "locker"
    })
});

app.get("/lockerdetails", (req, res) => {
    res.render("lockerdetails", {
        title: "Locker Selecteren",
        style: "lockerdetails"
    })
});

app.get("/shop", (req, res) => {
    res.render("shop", {
        title: "Winkel",
        style: "shop"
    })
});

app.get("/battle", (req, res) => {
    res.render("battle", {
        title: "Spelen",
        style: "battle"
    })
});

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get("port"));
});