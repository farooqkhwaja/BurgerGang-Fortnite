import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { connect, cosmeticsCollection, newsCollection, shopCollection, users, createUser } from "./database";
import bcrypt from "bcrypt";
import session from "./session";
import { ObjectId } from "mongodb";

dotenv.config();

const app: Express = express();

app.use(session)
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

// Middleware to load user data
app.use(async (req, res, next) => {
    try {
        // Get default items from cosmetics collection
        const defaultOutfit = await cosmeticsCollection.findOne({ "type.value": "outfit" });
        const defaultWeapon = await cosmeticsCollection.findOne({ "type.value": "pickaxe" });
        const defaultEmote = await cosmeticsCollection.findOne({ "type.value": "emote" });
        const defaultBackpack = await cosmeticsCollection.findOne({ "type.value": "backpack" });

        // Set default values for all variables
        res.locals.vBucks = 0;
        res.locals.wins = 0;
        res.locals.losses = 0;
        res.locals.favorites = [];
        res.locals.blacklisted = [];
        res.locals.boughtItems = [];
        res.locals.currentOutfit = defaultOutfit || null;
        res.locals.currentOutfitId = defaultOutfit?.id || null;
        res.locals.currentWeapon = defaultWeapon || null;
        res.locals.currentWeaponId = defaultWeapon?.id || null;
        res.locals.currentEmote = defaultEmote || null;
        res.locals.currentEmoteId = defaultEmote?.id || null;
        res.locals.currentBackpack = defaultBackpack || null;
        res.locals.currentBackpackId = defaultBackpack?.id || null;
        res.locals.path = req.path;

        // If user is logged in, load their data
        if (req.session.userId) {
            const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
            if (user) {
                // Safely access stats and ensure vBucks, wins, losses are numbers
                res.locals.vBucks = Number(user.stats?.vBucks) || 0;
                res.locals.wins = Number(user.stats?.wins) || 0;
                res.locals.losses = Number(user.stats?.losses) || 0;

                // Safely access collections with default values
                res.locals.favorites = user.collections?.favorites || [];
                res.locals.blacklisted = user.collections?.blacklisted || [];
                res.locals.boughtItems = user.collections?.boughtItems || [];

                // Safely access equipped items with default values
                res.locals.currentOutfit = user.equipped?.outfit?.item || defaultOutfit || null;
                res.locals.currentOutfitId = user.equipped?.outfit?.id || defaultOutfit?.id || null;
                res.locals.currentWeapon = user.equipped?.weapon?.item || defaultWeapon || null;
                res.locals.currentWeaponId = user.equipped?.weapon?.id || defaultWeapon?.id || null;
                res.locals.currentEmote = user.equipped?.emote?.item || defaultEmote || null;
                res.locals.currentEmoteId = user.equipped?.emote?.id || defaultEmote?.id || null;
                res.locals.currentBackpack = user.equipped?.backpack?.item || defaultBackpack || null;
                res.locals.currentBackpackId = user.equipped?.backpack?.id || defaultBackpack?.id || null;
            }
        }
        next();
    } catch (e) {
        console.error("Middleware error:", e);
        // Ensure all variables have default values even if there's an error
        res.locals.vBucks = 0;
        res.locals.wins = 0;
        res.locals.losses = 0;
        res.locals.favorites = [];
        res.locals.blacklisted = [];
        res.locals.boughtItems = [];
        res.locals.currentOutfit = null;
        res.locals.currentOutfitId = null;
        res.locals.currentWeapon = null;
        res.locals.currentWeaponId = null;
        res.locals.currentEmote = null;
        res.locals.currentEmoteId = null;
        res.locals.currentBackpack = null;
        res.locals.currentBackpackId = null;
        res.locals.path = req.path;
        next();
    }
});

app.get("/", (req, res) => {
    res.render("index", {
        title: "Launch",
        style: "index",
        path: "/"
    });
});

app.get("/login", (req, res) => {
    // If user is already logged in, redirect to lobby
    if (req.session.userId) {
        return res.redirect("/lobby");
    }

    // Get success message from query parameter
    const success = req.query.success as string;

    res.render("login", {
        title: "login",
        style: "login",
        path: "/login",
        success
    });
});

app.post("/login-form", async (req, res) => {
    try {
        // If user is already logged in, redirect to lobby
        if (req.session.userId) {
            return res.redirect("/lobby");
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Email and password are required",
                formData: { email }
            });
        }

        const user = await users.findOne({ email });
        if (!user) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Invalid credentials",
                formData: { email }
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Invalid credentials",
                formData: { email }
            });
        }

        // Create session
        req.session.userId = user._id.toString();
        req.session.isAuthenticated = true;

        res.redirect("/lobby");
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", {
            title: "login",
            style: "login",
            path: "/login",
            error: "Login failed. Please try again.",
            formData: req.body
        });
    }
});

app.post("/register-form", async (req, res) => {
    try {
        const { username, email, password, passwordConfirm } = req.body;

        // Validation
        const errors = [];
        if (!username || !email || !password || !passwordConfirm) {
            errors.push("All fields are required");
        }
        if (password !== passwordConfirm) {
            errors.push("Passwords don't match");
        }
        if (password.length < 8) {
            errors.push("Password must be 8+ characters");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Invalid email format");
        }

        if (errors.length > 0) {
            return res.render("register", {
                title: "register",
                style: "login",
                path: "/register",
                errors,
                formData: req.body // Preserve input
            });
        }

        await createUser(email, password);
        res.redirect("/login?success=Registration successful");

    } catch (error) {
        console.error("Registration error:", error);
        res.render("register", {
            title: "register",
            style: "login",
            path: "/register",
            errors: ["Registration failed. Please try again."],
            formData: req.body
        });
    }
});

app.get("/lobby", async (req, res) => {
    try {
        const newsItems = await newsCollection.find({}).toArray();
        res.render("lobby", {
            title: "Lobby",
            style: "lobby",
            path: "/lobby",
            wins: res.locals.wins || 0,
            losses: res.locals.losses || 0,
            newsItems: newsItems,
            currentOutfit: res.locals.currentOutfit || null,
            currentOutfitId: res.locals.currentOutfitId || null
        });
    } catch (e) {
        console.error(e);
        res.render("lobby", {
            title: "Lobby",
            style: "lobby",
            path: "/lobby",
            wins: 0,
            losses: 0,
            newsItems: [],
            currentOutfit: res.locals.currentOutfit || null,
            currentOutfitId: res.locals.currentOutfitId || null
        });
    }
})

app.get("/shop", async (req, res) => {
    try {
        const shopItems = await shopCollection.find({}).toArray();

        // Process items with duplicate prevention
        const processItems = (type: string) => {
            const seen = new Set();
            return shopItems
                .flatMap(entry =>
                    (entry.brItems || [])
                        .filter((item: { type?: { value: string } }) => item?.type?.value === type)
                        .map((item: { id?: string; name?: string; finalPrice?: number }) => ({
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
            path: "/shop",
            skinsOnly: processItems("outfit"),
            weaponsOnly: processItems("pickaxe"),
            emotesOnly: processItems("emote"),
            vBucks: res.locals.vBucks,
            boughtItems: res.locals.boughtItems
        });
    } catch (e) {
        console.error(e);
        res.render("shop", {
            title: "Winkel",
            style: "shop",
            path: "/shop",
            vBucks: res.locals.vBucks,
            boughtItems: res.locals.boughtItems
        });
    }
});

app.post("/shop", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const item = JSON.parse(req.body.item);
        const price = parseInt(req.body.price);

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user || user.stats.vBucks < price) {
            return res.redirect("/shop");
        }

        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            {
                $push: { "collections.boughtItems": item },
                $inc: { "stats.vBucks": -price }
            }
        );

        res.redirect("/shop");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing purchase");
    }
});

app.get("/battle", (req, res) => {
    res.render("battle", {
        title: "Spelen",
        style: "battle",
        path: "/battle"
    });
});

app.post("/battle", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const win = req.body.win === 'true';
        const loss = req.body.loss === 'true';

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Ensure stats fields are numbers, default to 0 if not
        user.stats.vBucks = typeof user.stats.vBucks === 'number' ? user.stats.vBucks : 0;
        user.stats.wins = typeof user.stats.wins === 'number' ? user.stats.wins : 0;
        user.stats.losses = typeof user.stats.losses === 'number' ? user.stats.losses : 0;

        if (win) {
            user.stats.wins += 1;
            user.stats.vBucks += 500;
        }
        if (loss) {
            user.stats.losses += 1;
        }

        await users.replaceOne(
            { _id: new ObjectId(req.session.userId) },
            user
        );

        res.redirect("/battle");
    } catch (error) {
        console.error("Battle route error:", error);
        res.status(500).send("Error updating battle stats");
    }
});

app.get("/locker", (req, res) => {
    res.render("locker", {
        title: "Locker",
        style: "locker",
        path: "/locker",
        currentOutfit: res.locals.currentOutfit || null,
        currentOutfitId: res.locals.currentOutfitId || null,
        currentWeapon: res.locals.currentWeapon || null,
        currentWeaponId: res.locals.currentWeaponId || null,
        currentEmote: res.locals.currentEmote || null,
        currentEmoteId: res.locals.currentEmoteId || null,
        currentBackpack: res.locals.currentBackpack || null,
        currentBackpackId: res.locals.currentBackpackId || null
    });
});

app.get("/lockerdetails", async (req, res) => {
    try {
        const shopItems = await shopCollection.find({}).toArray();
        const shopItemIds = new Set(
            shopItems.flatMap(entry =>
                (entry.brItems || []).map((item: { id: string }) => item.id)
            )
        );

        const cosmetics = await cosmeticsCollection.find({}).toArray();

        const getAvailableItems = (type: string) => {
            return cosmetics.filter(item =>
                item.type.value === type &&
                !res.locals.favorites.some((fav: { id: string }) => fav.id === item.id) &&
                !res.locals.blacklisted.some((bl: { id: string }) => bl.id === item.id) &&
                !shopItemIds.has(item.id)
            );
        };

        res.render("lockerdetails", {
            title: "Locker Selecteren",
            style: "lockerdetails",
            path: "/lockerdetails",
            skins: getAvailableItems("outfit").slice(0, 15),
            weapons: getAvailableItems("pickaxe").slice(0, 15),
            emotes: getAvailableItems("emote").slice(0, 15),
            backpack: getAvailableItems("backpack").slice(0, 15),
            favorites: res.locals.favorites,
            blacklisted: res.locals.blacklisted,
            boughtItems: res.locals.boughtItems,
            currentEmoteId: res.locals.currentEmoteId,
            currentOutfitId: res.locals.currentOutfitId,
            currentWeaponId: res.locals.currentWeaponId,
            currentBackpackId: res.locals.currentBackpackId
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("Error loading data");
    }
});

app.post("/remove-favorite", (req, res) => {
    const itemId = req.body.itemId;
    const item = res.locals.favorites.find((item: { id: string }) => item.id === itemId);

    if (item) {
        const newFavorites = res.locals.favorites.filter((fav: { id: string }) => fav.id !== itemId);
        const newBoughtItems = res.locals.boughtItems.some((bought: { id: string }) => bought.id === itemId)
            ? [...res.locals.boughtItems, item]
            : res.locals.boughtItems;

        res.locals.favorites = newFavorites;
        res.locals.boughtItems = newBoughtItems;
    }

    res.redirect("/lockerdetails");
});

app.post("/remove-blacklisted", (req, res) => {
    const itemId = req.body.itemId;
    const item = res.locals.blacklisted.find((item: { id: string }) => item.id === itemId);

    if (item) {
        const newBlacklisted = res.locals.blacklisted.filter((bl: { id: string }) => bl.id !== itemId);
        const newBoughtItems = res.locals.boughtItems.some((bought: { id: string }) => bought.id === itemId)
            ? [...res.locals.boughtItems, item]
            : res.locals.boughtItems;

        res.locals.blacklisted = newBlacklisted;
        res.locals.boughtItems = newBoughtItems;
    }

    res.redirect("/lockerdetails");
});

app.post("/equip-item", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const { itemId, itemType } = req.body;
        const item = await cosmeticsCollection.findOne({ id: itemId });

        if (!item) {
            return res.status(404).send("Item not found");
        }

        const update: any = {};
        switch (itemType) {
            case "outfit":
                update["equipped.outfit"] = { item, id: itemId };
                break;
            case "pickaxe":
                update["equipped.weapon"] = { item, id: itemId };
                break;
            case "emote":
                update["equipped.emote"] = { item, id: itemId };
                break;
            case "backpack":
                update["equipped.backpack"] = { item, id: itemId };
                break;
        }

        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $set: update }
        );

        res.redirect("/lockerdetails");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error equipping item");
    }
});

app.post("/lockerdetails", (req, res) => {
    try {
        if (req.body.favorite) {
            const item = JSON.parse(req.body.favorite);
            // Check if item is already in favorites
            if (!res.locals.favorites.some((fav: { id: string }) => fav.id === item.id)) {
                res.locals.favorites.push(item);
                res.locals.boughtItems = res.locals.boughtItems.filter((bought: { id: string }) => bought.id !== item.id);
            }
        }

        if (req.body.blacklisted) {
            const item = JSON.parse(req.body.blacklisted);
            // Check if item is already blacklisted
            if (!res.locals.blacklisted.some((bl: { id: string }) => bl.id === item.id)) {
                res.locals.blacklisted.push(item);
                res.locals.boughtItems = res.locals.boughtItems.filter((bought: { id: string }) => bought.id !== item.id);
            }
        }

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error processing request");
    }
});

app.get("/item/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const item = await cosmeticsCollection.findOne({ id });
        if (!item) {
            return res.status(404).render("item", {
                error: "Item not found",
                style: "item",
                path: "/item/" + id,
                item: null,
                favorites: res.locals.favorites,
                blacklisted: res.locals.blacklisted,
                currentOutfitId: res.locals.currentOutfitId,
                currentWeaponId: res.locals.currentWeaponId,
                currentEmoteId: res.locals.currentEmoteId,
                currentBackpackId: res.locals.currentBackpackId
            });
        }
        res.render("item", {
            title: item.name,
            style: "item",
            path: "/item/" + id,
            item,
            error: null,
            favorites: res.locals.favorites,
            blacklisted: res.locals.blacklisted,
            currentOutfitId: res.locals.currentOutfitId,
            currentWeaponId: res.locals.currentWeaponId,
            currentEmoteId: res.locals.currentEmoteId,
            currentBackpackId: res.locals.currentBackpackId
        });
    } catch (e) {
        console.error(e);
        res.status(500).render("item", {
            error: "Error loading item",
            style: "item",
            path: "/item/" + id,
            item: null,
            favorites: res.locals.favorites,
            blacklisted: res.locals.blacklisted,
            currentOutfitId: res.locals.currentOutfitId,
            currentWeaponId: res.locals.currentWeaponId,
            currentEmoteId: res.locals.currentEmoteId,
            currentBackpackId: res.locals.currentBackpackId
        });
    }
});

app.post("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Error logging out");
        }
        // Clear the session cookie
        res.clearCookie("connect.sid");
        // Redirect to login page
        res.redirect("/login");
    });
});

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get("port"))
})