import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { connect, cosmeticsCollection, newsCollection, shopCollection, users, createUser } from "./database";
import bcrypt from "bcrypt";
import session from "./session";
import { ObjectId } from "mongodb";

declare module 'express-session' {
    interface Session {
        userId?: string;
        isAuthenticated?: boolean;
        blacklisted?: boolean;
        blacklistMessage?: string;
    }
}

dotenv.config();

const app: Express = express();

app.use(session)
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

app.use(async (req, res, next) => {
    try {
        const defaultOutfit = await cosmeticsCollection.findOne({ "type.value": "outfit" });
        const defaultWeapon = await cosmeticsCollection.findOne({ "type.value": "pickaxe" });
        const defaultEmote = await cosmeticsCollection.findOne({ "type.value": "emote" });
        const defaultBackpack = await cosmeticsCollection.findOne({ "type.value": "backpack" });

        res.locals.vBucks = 0;
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

        if (req.session.userId) {
            const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
            if (user) {
                res.locals.vBucks = Number(user.stats?.vBucks) || 0;
                res.locals.username = user.username;
                res.locals.email = user.email;
                res.locals.createdAt = user.createdAt;

                res.locals.favorites = user.collections?.favorites || [];
                res.locals.blacklisted = user.collections?.blacklisted || [];
                res.locals.boughtItems = user.collections?.boughtItems || [];

                res.locals.currentOutfit = user.equipped?.outfit?.item || defaultOutfit || null;
                res.locals.currentOutfitId = user.equipped?.outfit?.id || defaultOutfit?.id || null;
                res.locals.currentWeapon = user.equipped?.weapon?.item || defaultWeapon || null;
                res.locals.currentWeaponId = user.equipped?.weapon?.id || defaultWeapon?.id || null;
                res.locals.currentEmote = user.equipped?.emote?.item || defaultEmote || null;
                res.locals.currentEmoteId = user.equipped?.emote?.id || defaultEmote?.id || null;
                res.locals.currentBackpack = user.equipped?.backpack?.item || defaultBackpack || null;
                res.locals.currentBackpackId = user.equipped?.backpack?.id || defaultBackpack?.id || null;

                if (res.locals.currentOutfit && res.locals.currentOutfitId) {
                    const outfitStats = user.collections?.outfitStats?.[res.locals.currentOutfitId] || { wins: 0, losses: 0 };
                    res.locals.currentOutfit.stats = outfitStats;
                }
            }
        }
        next();
    } catch (e) {
        console.error("Middleware error:", e);
        res.locals.vBucks = 0;
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

const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
};

const preventAuth = (req: any, res: any, next: any) => {
    if (req.session.userId) {
        return res.redirect("/lobby");
    }
    next();
};

app.get("/", (req, res) => {
    res.render("index", {
        title: "Launch",
        style: "index",
        path: "/"
    });
});

app.get("/login", preventAuth, (req, res) => {
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
        if (req.session.userId) {
            return res.redirect("/lobby");
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Email en wachtwoord zijn verplicht",
                formData: { email }
            });
        }

        const user = await users.findOne({ email });
        if (!user) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Ongeldige inloggegevens",
                formData: { email }
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Ongeldige inloggegevens",
                formData: { email }
            });
        }

        req.session.userId = user._id.toString();
        req.session.isAuthenticated = true;

        res.redirect("/lobby");
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", {
            title: "login",
            style: "login",
            path: "/login",
            error: "Inloggen mislukt. Probeer het opnieuw.",
            formData: req.body
        });
    }
});

app.post("/register-form", async (req, res) => {
    try {
        const username = req.body.username
        const email = req.body.email
        const password = req.body.password
        const passwordConfirm = req.body.passwordConfirm

        const errors = [];
        if (!username || !email || !password || !passwordConfirm) {
            errors.push("Alle velden zijn verplicht");
        }
        if (password !== passwordConfirm) {
            errors.push("Wachtwoorden komen niet overeen");
        }
        if (password.length < 8) {
            errors.push("Wachtwoord moet minimaal 8 tekens lang zijn");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("Ongeldig emailadres");
        }

        if (errors.length > 0) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                errors,
                formData: req.body 
            });
        }

        try {
            await createUser(email, password, username);
            res.redirect("/login?success=Registratie succesvol");
        } catch (error: any) {
            if (error.message === "Email already in use") {
                return res.render("login", {
                    title: "login",
                    style: "login",
                    path: "/login",
                    errors: ["Dit emailadres is al geregistreerd"],
                    formData: req.body
                });
            }
            throw error;
        }

    } catch (error: any) {
        console.error("Registration error:", error);
        res.render("login", {
            title: "login",
            style: "login",
            path: "/login",
            errors: ["Registratie mislukt. Probeer het opnieuw."],
            formData: req.body
        });
    }
});

app.get("/lobby", requireAuth, async (req, res) => {
    try {
        const newsItems = await newsCollection.find({}).toArray();

        const currentOutfit = res.locals.currentOutfit;
        const outfitStats = currentOutfit?.stats || { wins: 0, losses: 0 };

        res.render("lobby", {
            title: "Lobby",
            style: "lobby",
            path: "/lobby",
            wins: outfitStats.wins || 0,
            losses: outfitStats.losses || 0,
            newsItems: newsItems,
            currentOutfit: currentOutfit || null,
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

app.get("/shop", requireAuth, async (req, res) => {
    try {
        const shopItems = await shopCollection.find({}).toArray();

        const processItems = (type: string) => {
            const seen = new Set();
            return shopItems
                .flatMap(entry =>
                    (entry.brItems || [])
                        .filter((item: { type?: { value: string } }) => item?.type?.value === type)
                        .map((item: { id?: string; name?: string; finalPrice?: number }) => ({
                            ...item,
                            finalPrice: entry.finalPrice,
                            isBought: res.locals.boughtItems?.some((bought: { id: string }) => bought.id === item.id) ||
                                res.locals.favorites?.some((fav: { id: string }) => fav.id === item.id) ||
                                res.locals.blacklisted?.some((bl: { id: string }) => bl.id === item.id)
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

        if (!user.collections?.boughtItems?.some((bought: { id: string }) => bought.id === item.id)) {
            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                {
                    $push: { "collections.boughtItems": item },
                    $inc: { "stats.vBucks": -price }
                }
            );
        }

        res.redirect("/shop");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing purchase");
    }
});

app.get("/battle", requireAuth, (req, res) => {
    const currentOutfit = res.locals.currentOutfit;
    const outfitStats = currentOutfit?.stats || { wins: 0, losses: 0 };

    res.render("battle", {
        title: "Spelen",
        style: "battle",
        path: "/battle",
        wins: outfitStats.wins || 0,
        losses: outfitStats.losses || 0,
        currentOutfit: currentOutfit,
        blacklisted: req.session.blacklisted,
        blacklistMessage: req.session.blacklistMessage
    });

    req.session.blacklisted = false;
    req.session.blacklistMessage = undefined;
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
            return res.status(404).send("Gebruiker niet gevonden");
        }

        user.stats.vBucks = typeof user.stats.vBucks === 'number' ? user.stats.vBucks : 0;

        if (user.equipped?.outfit?.id) {
            const outfitId = user.equipped.outfit.id;
            const outfitStats = user.collections?.outfitStats?.[outfitId] || { wins: 0, losses: 0 };

            if (win) {
                outfitStats.wins = (outfitStats.wins || 0) + 1;
                user.stats.vBucks += 500;
            }
            if (loss) {
                outfitStats.losses = (outfitStats.losses || 0) + 1;
            }

            if (outfitStats.losses >= 3 && outfitStats.losses >= outfitStats.wins * 3) {
                if (!user.collections?.blacklisted?.some((bl: { id: string }) => bl.id === outfitId)) {
                    const currentOutfit = user.equipped.outfit.item;
                    const updatedBlacklisted = [...(user.collections?.blacklisted || []), currentOutfit];

                    const updatedFavorites = (user.collections?.favorites || []).filter((fav: { id: string }) => fav.id !== outfitId);

                    const updatedBoughtItems = (user.collections?.boughtItems || []).filter((bought: { id: string }) => bought.id !== outfitId);

                    const availableOutfits = (user.collections?.boughtItems || [])
                        .filter((item: any) =>
                            item.type.value === 'outfit' &&
                            !user.collections?.blacklisted?.some((bl: { id: string }) => bl.id === item.id)
                        );

                    let newOutfit = null;
                    if (availableOutfits.length > 0) {
                        newOutfit = availableOutfits[Math.floor(Math.random() * availableOutfits.length)];
                    } else {
                        newOutfit = await cosmeticsCollection.findOne({ "type.value": "outfit" });
                    }

                    const updatedOutfitStats = { ...user.collections?.outfitStats || {} };
                    updatedOutfitStats[outfitId] = { wins: 0, losses: 0 };

                    await users.updateOne(
                        { _id: new ObjectId(req.session.userId) },
                        {
                            $set: {
                                "equipped.outfit": null
                            }
                        }
                    );

                    await users.updateOne(
                        { _id: new ObjectId(req.session.userId) },
                        {
                            $set: {
                                "collections.blacklisted": updatedBlacklisted,
                                "collections.favorites": updatedFavorites,
                                "collections.boughtItems": updatedBoughtItems,
                                "equipped.outfit": {
                                    item: newOutfit,
                                    id: newOutfit?.id
                                },
                                [`collections.blacklistReasons.${outfitId}`]: "Personage trekt op niets",
                                "collections.outfitStats": updatedOutfitStats
                            }
                        }
                    );

                    res.redirect("/lockerdetails");
                    return;
                }
            }

            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                {
                    $set: {
                        "stats.vBucks": user.stats.vBucks,
                        [`collections.outfitStats.${outfitId}`]: outfitStats
                    }
                }
            );
        }

        res.redirect("/battle");
    } catch (error) {
        console.error("Battle route error:", error);
        res.status(500).send("Fout bij het bijwerken van battle statistieken");
    }
});

app.get("/locker", requireAuth, (req, res) => {
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

app.post("/random", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const outfits = await cosmeticsCollection.find({ "type.value": "outfit" }).toArray();
        const pickaxes = await cosmeticsCollection.find({ "type.value": "pickaxe" }).toArray();
        const emotes = await cosmeticsCollection.find({ "type.value": "emote" }).toArray();
        const backpacks = await cosmeticsCollection.find({ "type.value": "backpack" }).toArray();

        const getRandomItem = (items: any[]) => {
            const randomIndex = Math.floor(Math.random() * items.length);
            return items[randomIndex];
        };

        const randomOutfit = getRandomItem(outfits);
        const randomPickaxe = getRandomItem(pickaxes);
        const randomEmote = getRandomItem(emotes);
        const randomBackpack = getRandomItem(backpacks);

        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            {
                $set: {
                    "equipped.outfit": { item: randomOutfit, id: randomOutfit.id },
                    "equipped.weapon": { item: randomPickaxe, id: randomPickaxe.id },
                    "equipped.emote": { item: randomEmote, id: randomEmote.id },
                    "equipped.backpack": { item: randomBackpack, id: randomBackpack.id }
                }
            }
        );

        res.redirect("/locker");
    } catch (error) {
        console.error("Error randomizing items:", error);
        res.status(500).send("Error randomizing items");
    }
});

app.post("/setfavorite", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        const currentOutfit = JSON.parse(req.body.currentOutfit);
        if (!currentOutfit || !currentOutfit.images?.smallIcon) {
            return res.status(400).send("Geen geldig huidig outfit gevonden");
        }

        const smallIcon = currentOutfit.images.smallIcon;
        console.log("Setting profile picture to:", smallIcon);

        const isAlreadyFavorite = user.collections?.favorites?.some((fav: any) => fav.id === currentOutfit.id);
        if (!isAlreadyFavorite) {
            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                {
                    $set: { currentPfp: smallIcon },
                    $push: { "collections.favorites": currentOutfit }
                }
            );
        } else {
            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                { $set: { currentPfp: smallIcon } }
            );
        }

        res.redirect("/locker");
    } catch (error) {
        console.error("Error setting profile picture:", error);
        res.status(500).send("Fout bij het instellen van profielfoto");
    }
})

app.post("/showinfo", async (req, res) => {

})

app.get("/lockerdetails", requireAuth, async (req, res) => {
    try {
        const shopItems = await shopCollection.find({}).toArray();
        const shopItemIds = new Set(
            shopItems.flatMap(entry =>
                (entry.brItems || []).map((item: { id: string }) => item.id)
            )
        );

        const cosmetics = await cosmeticsCollection.find({}).toArray();

        const uniqueFavorites = Array.from(new Map(
            (res.locals.favorites || []).map((item: { id: string }) => [item.id, item])
        ).values()) as { id: string }[];

        const uniqueBlacklisted = Array.from(new Map(
            (res.locals.blacklisted || []).map((item: { id: string }) => [item.id, item])
        ).values()) as { id: string }[];

        const uniqueBoughtItems = Array.from(new Map(
            (res.locals.boughtItems || []).map((item: { id: string }) => [item.id, item])
        ).values()) as { id: string }[];

        const getAvailableItems = (type: string) => {
            return cosmetics.filter(item =>
                item.type.value === type &&
                !uniqueFavorites.some((fav: { id: string }) => fav.id === item.id) &&
                !uniqueBlacklisted.some((bl: { id: string }) => bl.id === item.id) &&
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
            favorites: uniqueFavorites,
            blacklisted: uniqueBlacklisted,
            boughtItems: uniqueBoughtItems,
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

app.post("/lockerdetails", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        if (req.body.favorite) {
            const item = JSON.parse(req.body.favorite);
            if (!user.collections?.favorites?.some((fav: { id: string }) => fav.id === item.id)) {
                const updatedFavorites = [...(user.collections?.favorites || []), item];
                const updatedBoughtItems = (user.collections?.boughtItems || []).filter((bought: { id: string }) => bought.id !== item.id);

                await users.updateOne(
                    { _id: new ObjectId(req.session.userId) },
                    {
                        $set: {
                            "collections.favorites": updatedFavorites,
                            "collections.boughtItems": updatedBoughtItems
                        }
                    }
                );
                res.locals.favorites = updatedFavorites;
                res.locals.boughtItems = updatedBoughtItems;
            }
        }

        if (req.body.blacklisted) {
            const item = JSON.parse(req.body.blacklisted);
            if (!user.collections?.blacklisted?.some((bl: { id: string }) => bl.id === item.id)) {
                const updatedFavorites = (user.collections?.favorites || []).filter((fav: { id: string }) => fav.id !== item.id);

                const updatedBoughtItems = (user.collections?.boughtItems || []).filter((bought: { id: string }) => bought.id !== item.id);

                const updatedBlacklisted = [...(user.collections?.blacklisted || []), item];

                const updatedOutfitStats = { ...user.collections?.outfitStats || {} };
                updatedOutfitStats[item.id] = { wins: 0, losses: 0 };

                await users.updateOne(
                    { _id: new ObjectId(req.session.userId) },
                    {
                        $set: {
                            "collections.favorites": updatedFavorites,
                            "collections.boughtItems": updatedBoughtItems,
                            "collections.blacklisted": updatedBlacklisted,
                            "collections.outfitStats": updatedOutfitStats,
                            [`collections.blacklistReasons.${item.id}`]: "Personage trekt op niets"
                        }
                    }
                );

                res.locals.favorites = updatedFavorites;
                res.locals.boughtItems = updatedBoughtItems;
                res.locals.blacklisted = updatedBlacklisted;

                return res.redirect(`/item/${item.id}/blacklisted`);
            }
        }

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error("Error in lockerdetails POST:", e);
        res.status(500).send("Fout bij het verwerken van het verzoek");
    }
});

app.post("/remove-favorite", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const itemId = req.body.itemId;
        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        const item = user.collections?.favorites?.find((fav: { id: string }) => fav.id === itemId);
        if (item) {
            const updatedFavorites = (user.collections?.favorites || []).filter((fav: { id: string }) => fav.id !== itemId);

            const shopItems = await shopCollection.find({}).toArray();
            const isFromShop = shopItems.some(shopItem =>
                shopItem.brItems?.some((brItem: { id: string }) => brItem.id === itemId)
            );

            let updatedBoughtItems = user.collections?.boughtItems || [];
            if (isFromShop) {
                updatedBoughtItems = [...updatedBoughtItems, item];
            }

            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                {
                    $set: {
                        "collections.favorites": updatedFavorites,
                        "collections.boughtItems": updatedBoughtItems
                    }
                }
            );
            res.locals.favorites = updatedFavorites;
            res.locals.boughtItems = updatedBoughtItems;
        }

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error("Error in remove-favorite POST:", e);
        res.status(500).send("Fout bij het verwijderen van favoriet");
    }
});

app.post("/remove-blacklisted", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const itemId = req.body.itemId;
        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        const item = user.collections?.blacklisted?.find((bl: { id: string }) => bl.id === itemId);
        if (item) {
            const updatedBlacklisted = (user.collections?.blacklisted || []).filter((bl: { id: string }) => bl.id !== itemId);

            const shopItems = await shopCollection.find({}).toArray();
            const isFromShop = shopItems.some(shopItem =>
                shopItem.brItems?.some((brItem: { id: string }) => brItem.id === itemId)
            );

            let updatedBoughtItems = user.collections?.boughtItems || [];
            if (isFromShop) {
                updatedBoughtItems = [...updatedBoughtItems, item];
            }

            const updatedBlacklistReasons = { ...user.collections?.blacklistReasons };
            delete updatedBlacklistReasons[itemId];

            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                {
                    $set: {
                        "collections.blacklisted": updatedBlacklisted,
                        "collections.boughtItems": updatedBoughtItems,
                        "collections.blacklistReasons": updatedBlacklistReasons
                    }
                }
            );
            res.locals.blacklisted = updatedBlacklisted;
            res.locals.boughtItems = updatedBoughtItems;
        }

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error("Error in remove-blacklisted POST:", e);
        res.status(500).send("Fout bij het verwijderen van zwarte lijst item");
    }
});

app.get("/item/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }

        const isBlacklisted = user.collections?.blacklisted?.some((bl: { id: string }) => bl.id === id);
        if (isBlacklisted) {
            return res.redirect(`/item/${id}/blacklisted`);
        }

        let item = await cosmeticsCollection.findOne({ id });

        if (!item) {
            const shopItems = await shopCollection.find({}).toArray();
            for (const shopItem of shopItems) {
                const foundItem = shopItem.brItems?.find((brItem: { id: string }) => brItem.id === id);
                if (foundItem) {
                    item = {
                        ...foundItem,
                        finalPrice: shopItem.finalPrice,
                        isBought: user.collections?.boughtItems?.some((bought: { id: string }) => bought.id === id) ||
                            user.collections?.favorites?.some((fav: { id: string }) => fav.id === id) ||
                            user.collections?.blacklisted?.some((bl: { id: string }) => bl.id === id)
                    };
                    break;
                }
            }
        }

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
                currentBackpackId: res.locals.currentBackpackId,
                vBucks: res.locals.vBucks
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
            currentBackpackId: res.locals.currentBackpackId,
            vBucks: res.locals.vBucks
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
            currentBackpackId: res.locals.currentBackpackId,
            vBucks: res.locals.vBucks
        });
    }
});

app.get("/item/:id/edit", requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });

        if (!user) {
            return res.redirect("/login");
        }

        let item = user.collections?.boughtItems?.find((bought: { id: string }) => bought.id === itemId);

        if (!item) {
            item = await cosmeticsCollection.findOne({ id: itemId });
        }

        if (!item) {
            return res.status(404).send("Item niet gevonden");
        }

        res.render("edit", {
            title: "Bewerken",
            style: "edit",
            path: `/item/${itemId}/edit`,
            currentOutfit: item
        });
    } catch (error) {
        console.error("Error loading edit page:", error);
        res.status(500).send("Fout bij het laden van de bewerkingspagina");
    }
});

app.post("/item/:id/edit", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const itemId = req.params.id;
        const { description } = req.body;
        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });

        if (!user) {
            return res.redirect("/login");
        }

        const boughtItemIndex = user.collections?.boughtItems?.findIndex((bought: { id: string }) => bought.id === itemId);

        if (boughtItemIndex !== -1 && boughtItemIndex !== undefined) {
            await users.updateOne(
                { _id: new ObjectId(req.session.userId) },
                { $set: { [`collections.boughtItems.${boughtItemIndex}.description`]: description } }
            );
        } else {
            await cosmeticsCollection.updateOne(
                { id: itemId },
                { $set: { description } }
            );
        }

        res.redirect(`/item/${itemId}`);
    } catch (error) {
        console.error("Error saving description:", error);
        res.status(500).send("Fout bij het opslaan van de beschrijving");
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Error logging out");
        }
        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

app.post("/equip-item", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const itemId = req.body.itemId;
        const itemType = req.body.itemType;

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        let item;
        if (user.collections?.favorites?.some((fav: { id: string }) => fav.id === itemId)) {
            item = user.collections.favorites.find((fav: { id: string }) => fav.id === itemId);
        } else if (user.collections?.boughtItems?.some((bought: { id: string }) => bought.id === itemId)) {
            item = user.collections.boughtItems.find((bought: { id: string }) => bought.id === itemId);
        } else {
            item = await cosmeticsCollection.findOne({ id: itemId });
        }

        if (!item) {
            return res.status(404).send("Item niet gevonden");
        }

        const dbField = itemType === 'pickaxe' ? 'weapon' : itemType;

        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            {
                $set: {
                    [`equipped.${dbField}`]: { item, id: item.id }
                }
            }
        );

        res.redirect("/lockerdetails");
    } catch (e) {
        console.error("Error equipping item:", e);
        res.status(500).send("Fout bij het uitrusten van item");
    }
});

app.get("/item/:id/blacklisted", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }

        const blacklistedItem = user.collections?.blacklisted?.find((bl: { id: string }) => bl.id === id);
        if (!blacklistedItem) {
            return res.redirect("/lockerdetails");
        }

        const blacklistReason = user.collections?.blacklistReasons?.[id] || '';

        res.render("blacklisted", {
            title: "Zwarte Lijst Item",
            style: "blacklisted",
            path: `/item/${id}/blacklisted`,
            item: blacklistedItem,
            blacklistReason
        });
    } catch (error) {
        console.error("Error loading blacklisted page:", error);
        res.status(500).send("Fout bij het laden van de zwarte lijst pagina");
    }
});

app.post("/item/:id/blacklisted", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }

        const isBlacklisted = user.collections?.blacklisted?.some((bl: { id: string }) => bl.id === id);
        if (!isBlacklisted) {
            return res.redirect("/lockerdetails");
        }

        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $set: { [`collections.blacklistReasons.${id}`]: reason } }
        );

        res.redirect(`/item/${id}/blacklisted`);
    } catch (error) {
        console.error("Error saving blacklist reason:", error);
        res.status(500).send("Fout bij het opslaan van de reden");
    }
});

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get("port"))
})