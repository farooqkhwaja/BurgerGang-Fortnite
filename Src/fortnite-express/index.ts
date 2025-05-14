import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { Fortnite, MOTD, News, Shop, Entry } from "./types"

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
    next()
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

app.get("/lobby", async (req, res) => {

    try {
        const response = await fetch("https://fortnite-api.com/v2/news/br")
        const json : News = await response.json()
        const newsItems : MOTD[] = json.data.motds.slice(0, 5)

        res.render("lobby", {
            title: "Lobby",
            style: "lobby",
            newsItems: newsItems
    })

    } catch(e) {
        console.error(e)

        res.render("lobby", {
            title: "Lobby",
            style: "lobby",
            newsItems: []
        })
    }
});

app.get("/locker", (req, res) => {
    res.render("locker", {
        title: "Locker",
        style: "locker"
    })
});

// Modify your existing arrays to store all items
let allItems: any[] = []; // This will store ALL items from the API
let favorites: any[] = [];
let blacklisted: any[] = [];

// Update your lockerdetails route to populate allItems
app.get("/lockerdetails", async (req, res) => {
    try {
        const response = await fetch("https://fortnite-api.com/v2/cosmetics/new");
        const json: Fortnite = await response.json();
        allItems = json.data.items.br; // Store all items

        // Filter functions that exclude favorited/blacklisted items
        const getAvailableItems = (type: string) => {
            return allItems.filter(item => 
                item.type.value === type &&
                !favorites.some(fav => fav.id === item.id) &&
                !blacklisted.some(bl => bl.id === item.id)
            );
        };

        const skinsOnly = getAvailableItems("outfit");
        const weaponsOnly = getAvailableItems("pickaxe");
        const emotesOnly = getAvailableItems("emote");

        res.render("lockerdetails", {
            title: "Locker Selecteren",
            style: "lockerdetails",
            skins: skinsOnly,
            weapons: weaponsOnly,
            emotes: emotesOnly,
            favorites: favorites,
            blacklisted: blacklisted
        });

    } catch(e) {
        console.error(e);
        res.status(500).send("Error loading data");
    }
});

// Updated POST endpoint
app.post("/lockerdetails", (req, res) => {
    try {
        if (req.body.favorite) {
            const favoriteItem = JSON.parse(req.body.favorite);
            if (!favorites.some(item => item.id === favoriteItem.id)) {
                favorites.push(favoriteItem);
            }
        }

        if (req.body.blacklisted) {
            const blacklistedItem = JSON.parse(req.body.blacklisted);
            if (!blacklisted.some(item => item.id === blacklistedItem.id)) {
                blacklisted.push(blacklistedItem);
            }
        }

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error(e);
        res.status(500).redirect("/lockerdetails");
    }
});

// Updated removal endpoints
app.post("/remove-favorite", (req, res) => {
    const itemId = req.body.itemId;
    const item = favorites.find(item => item.id === itemId);
    favorites = favorites.filter(item => item.id !== itemId);
    res.redirect("/lockerdetails");
});

app.post("/remove-blacklisted", (req, res) => {
    const itemId = req.body.itemId;
    const item = blacklisted.find(item => item.id === itemId);
    blacklisted = blacklisted.filter(item => item.id !== itemId);
    res.redirect("/lockerdetails");
});

app.get("/shop", async (req, res) => {

    try {
        const response = await fetch("https://fortnite-api.com/v2/shop")
        const json : Shop = await response.json()

        const items : Entry[] = json.data.entries

        const skinsOnly = items
            .flatMap(entry => 
            (entry.brItems || [])
                .filter(item => item?.type?.value === "outfit")
                .map(outfit => ({
                    ...outfit,
                    finalPrice: entry.finalPrice
                }))
        )

        const weaponsOnly = items
            .flatMap(entry => 
            (entry.brItems || [])
                .filter(item => item?.type?.value === "pickaxe")
                .map(outfit => ({
                    ...outfit,
                    finalPrice: entry.finalPrice
                }))
        )

        const emotesOnly = items
            .flatMap(entry => 
            (entry.brItems || [])
                .filter(item => item?.type?.value === "emote")
                .map(outfit => ({
                    ...outfit,
                    finalPrice: entry.finalPrice
                }))
        )

        res.render("shop", {
        title: "Winkel",
        style: "shop",
        skinsOnly: skinsOnly,
        emotesOnly: emotesOnly,
        weaponsOnly: weaponsOnly
        })

    } catch(e) {
        console.error(e)

        res.render("shop", {
        title: "Winkel",
        style: "shop"
        })
    }
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