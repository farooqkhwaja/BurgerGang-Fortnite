import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { Fortnite, MOTD, News, Shop, Entry } from "./types"

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

let vBucks: number = 2000
let wins: number = 0
let losses: number = 0


app.use(async (req, res, next) => {

    try {
        const response = await fetch("https://fortnite-api.com/v2/cosmetics/new")
        const json: Fortnite = await response.json()



        res.locals.wins = wins
        res.locals.losses = losses
        res.locals.vBucks = vBucks
        res.locals.path = req.path
        res.locals.currentOutfit = currentOutfit
        res.locals.currentWeapon = currentWeapon
        res.locals.currentEmote = currentEmote
    } catch (e) {
        console.error(e)
    }
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
        const json: News = await response.json()
        const newsItems: MOTD[] = json.data.motds.slice(0, 5)

        res.render("lobby", {
            title: "Lobby",
            style: "lobby",
            newsItems: newsItems
        })

    } catch (e) {
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

let favorites: any[] = []
let blacklisted: any[] = []

let currentOutfit: any = null;
let currentOutfitId: string | null = null;
let currentEmote: any = null;
let currentEmoteId: string | null = null;
let currentWeapon: any = null;
let currentWeaponId: string | null = null;

app.get("/lockerdetails", async (req, res) => {
    try {
        const shopResponse = await fetch("https://fortnite-api.com/v2/shop");
        const shopJson: Shop = await shopResponse.json();
        const shopItemIds = new Set(
            shopJson.data.entries.flatMap(entry =>
                (entry.brItems || []).map(item => item.id)
            ))

        const response = await fetch("https://fortnite-api.com/v2/cosmetics/new")
        const json: Fortnite = await response.json()
        let items: any[] = json.data.items.br

        const getAvailableItems = (type: string) => {
            return items.filter(item =>
                item.type.value === type &&
                !favorites.some(fav => fav.id === item.id) &&
                !blacklisted.some(bl => bl.id === item.id) &&
                !shopItemIds.has(item.id)
            );
        };

        res.render("lockerdetails", {
            title: "Locker Selecteren",
            style: "lockerdetails",
            skins: getAvailableItems("outfit").slice(0, 15),
            weapons: getAvailableItems("pickaxe").slice(0, 15),
            emotes: getAvailableItems("emote").slice(0, 15),
            favorites: favorites,
            blacklisted: blacklisted,
            boughtItems: boughtItems,
            currentEmoteId: currentEmoteId,
            currentOutfitId: currentOutfitId,
            currentWeaponId: currentWeaponId
        });

    } catch (e) {
        console.error(e);
        res.status(500).send("Error loading data");
    }
});

app.post("/remove-favorite", (req, res) => {
    const itemId = req.body.itemId;
    const item = favorites.find(item => item.id === itemId);

    if (item) {
        favorites = favorites.filter(fav => fav.id !== itemId);
        // Only add to boughtItems if it was originally purchased
        if (boughtItems.some(bought => bought.id === itemId)) {
            boughtItems.push(item);
        }
    }

    res.redirect("/lockerdetails");
});

app.post("/remove-blacklisted", (req, res) => {
    const itemId = req.body.itemId;
    const item = blacklisted.find(item => item.id === itemId);

    if (item) {
        blacklisted = blacklisted.filter(bl => bl.id !== itemId);
        // Only add to boughtItems if it was originally purchased
        if (boughtItems.some(bought => bought.id === itemId)) {
            boughtItems.push(item);
        }
    }

    res.redirect("/lockerdetails");
})

let boughtItems: any[] = []

app.get("/shop", async (req, res) => {
    try {
        const response = await fetch("https://fortnite-api.com/v2/shop");
        const json: Shop = await response.json();

        const items: Entry[] = json.data.entries;

        // Process items with duplicate prevention
        const processItems = (type: string) => {
            const seen = new Set();
            return items
                .flatMap(entry =>
                    (entry.brItems || [])
                        .filter(item => item?.type?.value === type)
                        .map(item => ({
                            ...item,
                            finalPrice: entry.finalPrice
                        }))
                )
                .filter(item => {
                    const identifier = item.id || `${item.name}-${item.finalPrice}`;
                    return !seen.has(identifier) && seen.add(identifier);
                })
                .slice(0, 6)
        };

        res.render("shop", {
            title: "Winkel",
            style: "shop",
            skinsOnly: processItems("outfit"),
            weaponsOnly: processItems("pickaxe"),
            emotesOnly: processItems("emote"),
            vBucks: vBucks,
            boughtItems: boughtItems
        });

    } catch (e) {
        console.error(e);
        res.render("shop", {
            title: "Winkel",
            style: "shop",
            vBucks: vBucks,
            boughtItems: boughtItems
        });
    }
});

app.post("/shop", (req, res) => {
    try {
        const item = JSON.parse(req.body.item);
        const itemPrice = parseInt(req.body.price);

        if (vBucks >= itemPrice) {
            vBucks -= itemPrice;
            boughtItems.push(item);
            res.redirect("/shop")
        } else {
            res.render("shop", {
                error: "Niet genoeg V-Bucks!",
                vBucks: vBucks,
                boughtItems: boughtItems
            });
        }
    } catch (e) {
        console.error(e);
        res.redirect("/shop");
    }
})

app.get("/battle", (req, res) => {

    res.render("battle", {
        title: "Spelen",
        style: "battle"
    })
})

app.post("/battle", (req, res) => {

    let win: boolean = req.body.win
    let loss: boolean = req.body.loss

    if (win) {
        wins++
        vBucks += 100
    }
    if (loss) {
        losses++
    }

    res.redirect("/battle")
})

app.post("/equip-item", async (req, res) => {
    try {
        const { itemId, itemType } = req.body;

        // Fetch the item details from the API
        const response = await fetch("https://fortnite-api.com/v2/cosmetics/new");
        const json: Fortnite = await response.json();
        const items = json.data.items.br;

        // Find the item in the API response
        const item = items.find(i => i.id === itemId);

        if (!item) {
            return res.status(404).send("Item not found");
        }

        // Update the appropriate current item based on type
        switch (itemType) {
            case "outfit":
                currentOutfit = item;
                currentOutfitId = item.id;
                break;
            case "pickaxe":
                currentWeapon = item;
                currentWeaponId = item.id;
                break;
            case "emote":
                currentEmote = item;
                currentEmoteId = item.id;
                break;
            default:
                return res.status(400).send("Invalid item type");
        }

        // Redirect back to the locker details page
        res.redirect("/lockerdetails");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error equipping item");
    }
});

// Add favorite item
app.post("/lockerdetails", (req, res) => {
    try {
        if (req.body.favorite) {
            const item = JSON.parse(req.body.favorite);
            // Check if item is already in favorites
            if (!favorites.some(fav => fav.id === item.id)) {
                favorites.push(item);
                // Remove from boughtItems if it was there
                boughtItems = boughtItems.filter(bought => bought.id !== item.id);
            }
        }

        if (req.body.blacklisted) {
            const item = JSON.parse(req.body.blacklisted);
            // Check if item is already blacklisted
            if (!blacklisted.some(bl => bl.id === item.id)) {
                blacklisted.push(item);
                // Remove from boughtItems if it was there
                boughtItems = boughtItems.filter(bought => bought.id !== item.id);
            }
        }

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error processing request");
    }
});

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get("port"))
})