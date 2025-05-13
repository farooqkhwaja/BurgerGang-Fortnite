import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { Fortnite } from "./types"

dotenv.config();

const app : Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

app.use(async (req, res, next) => {
    try {
        const response = await fetch("https://fortnite-api.com/v2/cosmetics/new")
        const json : Fortnite = await response.json()

        const collection = json.data.items.br

        const skinsOnly = collection.filter((skin) => {
            return skin.type.value === "outfit"
        })

        const weaponsOnly = collection.filter((weapon) => {
            return weapon.type.value === "pickaxe"
        })

        const emotesOnly = collection.filter((emote) => {
            return emote.type.value === "emote"
        })

        res.locals.skins = skinsOnly
        res.locals.weapons = weaponsOnly
        res.locals.emotes = emotesOnly
        res.locals.path = req.path;
    
    next()

    } catch(e) {
        console.error(e)
    }
})

app.get("/", (req, res) => {
    res.render("index", {
        title: "Launch",
        style: "index"
    })
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "login",
        style: "login"
    })
})

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