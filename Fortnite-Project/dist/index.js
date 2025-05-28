"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const session_1 = __importDefault(require("./session"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(session_1.default);
app.set("view engine", "ejs");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
app.set("views", path_1.default.join(__dirname, "..", "views"));
app.set("port", process.env.PORT || 3000);
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    try {
        const defaultOutfit = yield database_1.cosmeticsCollection.findOne({ "type.value": "outfit" });
        const defaultWeapon = yield database_1.cosmeticsCollection.findOne({ "type.value": "pickaxe" });
        const defaultEmote = yield database_1.cosmeticsCollection.findOne({ "type.value": "emote" });
        const defaultBackpack = yield database_1.cosmeticsCollection.findOne({ "type.value": "backpack" });
        res.locals.vBucks = 0;
        res.locals.favorites = [];
        res.locals.blacklisted = [];
        res.locals.boughtItems = [];
        res.locals.currentOutfit = defaultOutfit || null;
        res.locals.currentOutfitId = (defaultOutfit === null || defaultOutfit === void 0 ? void 0 : defaultOutfit.id) || null;
        res.locals.currentWeapon = defaultWeapon || null;
        res.locals.currentWeaponId = (defaultWeapon === null || defaultWeapon === void 0 ? void 0 : defaultWeapon.id) || null;
        res.locals.currentEmote = defaultEmote || null;
        res.locals.currentEmoteId = (defaultEmote === null || defaultEmote === void 0 ? void 0 : defaultEmote.id) || null;
        res.locals.currentBackpack = defaultBackpack || null;
        res.locals.currentBackpackId = (defaultBackpack === null || defaultBackpack === void 0 ? void 0 : defaultBackpack.id) || null;
        res.locals.path = req.path;
        if (req.session.userId) {
            const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
            if (user) {
                res.locals.vBucks = Number((_a = user.stats) === null || _a === void 0 ? void 0 : _a.vBucks) || 0;
                res.locals.username = user.username;
                res.locals.email = user.email;
                res.locals.createdAt = user.createdAt;
                res.locals.favorites = ((_b = user.collections) === null || _b === void 0 ? void 0 : _b.favorites) || [];
                res.locals.blacklisted = ((_c = user.collections) === null || _c === void 0 ? void 0 : _c.blacklisted) || [];
                res.locals.boughtItems = ((_d = user.collections) === null || _d === void 0 ? void 0 : _d.boughtItems) || [];
                res.locals.currentOutfit = ((_f = (_e = user.equipped) === null || _e === void 0 ? void 0 : _e.outfit) === null || _f === void 0 ? void 0 : _f.item) || defaultOutfit || null;
                res.locals.currentOutfitId = ((_h = (_g = user.equipped) === null || _g === void 0 ? void 0 : _g.outfit) === null || _h === void 0 ? void 0 : _h.id) || (defaultOutfit === null || defaultOutfit === void 0 ? void 0 : defaultOutfit.id) || null;
                res.locals.currentWeapon = ((_k = (_j = user.equipped) === null || _j === void 0 ? void 0 : _j.weapon) === null || _k === void 0 ? void 0 : _k.item) || defaultWeapon || null;
                res.locals.currentWeaponId = ((_m = (_l = user.equipped) === null || _l === void 0 ? void 0 : _l.weapon) === null || _m === void 0 ? void 0 : _m.id) || (defaultWeapon === null || defaultWeapon === void 0 ? void 0 : defaultWeapon.id) || null;
                res.locals.currentEmote = ((_p = (_o = user.equipped) === null || _o === void 0 ? void 0 : _o.emote) === null || _p === void 0 ? void 0 : _p.item) || defaultEmote || null;
                res.locals.currentEmoteId = ((_r = (_q = user.equipped) === null || _q === void 0 ? void 0 : _q.emote) === null || _r === void 0 ? void 0 : _r.id) || (defaultEmote === null || defaultEmote === void 0 ? void 0 : defaultEmote.id) || null;
                res.locals.currentBackpack = ((_t = (_s = user.equipped) === null || _s === void 0 ? void 0 : _s.backpack) === null || _t === void 0 ? void 0 : _t.item) || defaultBackpack || null;
                res.locals.currentBackpackId = ((_v = (_u = user.equipped) === null || _u === void 0 ? void 0 : _u.backpack) === null || _v === void 0 ? void 0 : _v.id) || (defaultBackpack === null || defaultBackpack === void 0 ? void 0 : defaultBackpack.id) || null;
                if (res.locals.currentOutfit && res.locals.currentOutfitId) {
                    const outfitStats = ((_x = (_w = user.collections) === null || _w === void 0 ? void 0 : _w.outfitStats) === null || _x === void 0 ? void 0 : _x[res.locals.currentOutfitId]) || { wins: 0, losses: 0 };
                    res.locals.currentOutfit.stats = outfitStats;
                }
            }
        }
        next();
    }
    catch (e) {
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
}));
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
};
const preventAuth = (req, res, next) => {
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
    const success = req.query.success;
    res.render("login", {
        title: "login",
        style: "login",
        path: "/login",
        success
    });
});
app.post("/login-form", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield database_1.users.findOne({ email });
        if (!user) {
            return res.render("login", {
                title: "login",
                style: "login",
                path: "/login",
                error: "Ongeldige inloggegevens",
                formData: { email }
            });
        }
        const match = yield bcrypt_1.default.compare(password, user.password);
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
    }
    catch (error) {
        console.error("Login error:", error);
        res.render("login", {
            title: "login",
            style: "login",
            path: "/login",
            error: "Inloggen mislukt. Probeer het opnieuw.",
            formData: req.body
        });
    }
}));
app.post("/register-form", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const passwordConfirm = req.body.passwordConfirm;
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
            yield (0, database_1.createUser)(email, password, username);
            res.redirect("/login?success=Registratie succesvol");
        }
        catch (error) {
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
    }
    catch (error) {
        console.error("Registration error:", error);
        res.render("login", {
            title: "login",
            style: "login",
            path: "/login",
            errors: ["Registratie mislukt. Probeer het opnieuw."],
            formData: req.body
        });
    }
}));
app.get("/lobby", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newsItems = yield database_1.newsCollection.find({}).toArray();
        const currentOutfit = res.locals.currentOutfit;
        const outfitStats = (currentOutfit === null || currentOutfit === void 0 ? void 0 : currentOutfit.stats) || { wins: 0, losses: 0 };
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
    }
    catch (e) {
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
}));
app.get("/shop", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopItems = yield database_1.shopCollection.find({}).toArray();
        const processItems = (type) => {
            const seen = new Set();
            return shopItems
                .flatMap(entry => (entry.brItems || [])
                .filter((item) => { var _a; return ((_a = item === null || item === void 0 ? void 0 : item.type) === null || _a === void 0 ? void 0 : _a.value) === type; })
                .map((item) => {
                var _a, _b, _c;
                return (Object.assign(Object.assign({}, item), { finalPrice: entry.finalPrice, isBought: ((_a = res.locals.boughtItems) === null || _a === void 0 ? void 0 : _a.some((bought) => bought.id === item.id)) ||
                        ((_b = res.locals.favorites) === null || _b === void 0 ? void 0 : _b.some((fav) => fav.id === item.id)) ||
                        ((_c = res.locals.blacklisted) === null || _c === void 0 ? void 0 : _c.some((bl) => bl.id === item.id)) }));
            }))
                .filter(item => {
                const identifier = item.id || `${item.name}-${item.finalPrice}`;
                return !seen.has(identifier) && seen.add(identifier);
            })
                .slice(0, 6);
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
    }
    catch (e) {
        console.error(e);
        res.render("shop", {
            title: "Winkel",
            style: "shop",
            path: "/shop",
            vBucks: res.locals.vBucks,
            boughtItems: res.locals.boughtItems
        });
    }
}));
app.post("/shop", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const item = JSON.parse(req.body.item);
        const price = parseInt(req.body.price);
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user || user.stats.vBucks < price) {
            return res.redirect("/shop");
        }
        if (!((_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.boughtItems) === null || _b === void 0 ? void 0 : _b.some((bought) => bought.id === item.id))) {
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                $push: { "collections.boughtItems": item },
                $inc: { "stats.vBucks": -price }
            });
        }
        res.redirect("/shop");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error processing purchase");
    }
}));
app.get("/battle", requireAuth, (req, res) => {
    const currentOutfit = res.locals.currentOutfit;
    const outfitStats = (currentOutfit === null || currentOutfit === void 0 ? void 0 : currentOutfit.stats) || { wins: 0, losses: 0 };
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
app.post("/battle", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const win = req.body.win === 'true';
        const loss = req.body.loss === 'true';
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }
        user.stats.vBucks = typeof user.stats.vBucks === 'number' ? user.stats.vBucks : 0;
        if ((_b = (_a = user.equipped) === null || _a === void 0 ? void 0 : _a.outfit) === null || _b === void 0 ? void 0 : _b.id) {
            const outfitId = user.equipped.outfit.id;
            const outfitStats = ((_d = (_c = user.collections) === null || _c === void 0 ? void 0 : _c.outfitStats) === null || _d === void 0 ? void 0 : _d[outfitId]) || { wins: 0, losses: 0 };
            if (win) {
                outfitStats.wins = (outfitStats.wins || 0) + 1;
                user.stats.vBucks += 500;
            }
            if (loss) {
                outfitStats.losses = (outfitStats.losses || 0) + 1;
            }
            if (outfitStats.losses >= 3 && outfitStats.losses >= outfitStats.wins * 3) {
                if (!((_f = (_e = user.collections) === null || _e === void 0 ? void 0 : _e.blacklisted) === null || _f === void 0 ? void 0 : _f.some((bl) => bl.id === outfitId))) {
                    const currentOutfit = user.equipped.outfit.item;
                    const updatedBlacklisted = [...(((_g = user.collections) === null || _g === void 0 ? void 0 : _g.blacklisted) || []), currentOutfit];
                    const updatedFavorites = (((_h = user.collections) === null || _h === void 0 ? void 0 : _h.favorites) || []).filter((fav) => fav.id !== outfitId);
                    const updatedBoughtItems = (((_j = user.collections) === null || _j === void 0 ? void 0 : _j.boughtItems) || []).filter((bought) => bought.id !== outfitId);
                    const availableOutfits = (((_k = user.collections) === null || _k === void 0 ? void 0 : _k.boughtItems) || [])
                        .filter((item) => {
                        var _a, _b;
                        return item.type.value === 'outfit' &&
                            !((_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.blacklisted) === null || _b === void 0 ? void 0 : _b.some((bl) => bl.id === item.id));
                    });
                    let newOutfit = null;
                    if (availableOutfits.length > 0) {
                        newOutfit = availableOutfits[Math.floor(Math.random() * availableOutfits.length)];
                    }
                    else {
                        newOutfit = yield database_1.cosmeticsCollection.findOne({ "type.value": "outfit" });
                    }
                    const updatedOutfitStats = Object.assign({}, ((_l = user.collections) === null || _l === void 0 ? void 0 : _l.outfitStats) || {});
                    updatedOutfitStats[outfitId] = { wins: 0, losses: 0 };
                    yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                        $set: {
                            "equipped.outfit": null
                        }
                    });
                    yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                        $set: {
                            "collections.blacklisted": updatedBlacklisted,
                            "collections.favorites": updatedFavorites,
                            "collections.boughtItems": updatedBoughtItems,
                            "equipped.outfit": {
                                item: newOutfit,
                                id: newOutfit === null || newOutfit === void 0 ? void 0 : newOutfit.id
                            },
                            [`collections.blacklistReasons.${outfitId}`]: "Personage trekt op niets",
                            "collections.outfitStats": updatedOutfitStats
                        }
                    });
                    res.redirect("/lockerdetails");
                    return;
                }
            }
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                $set: {
                    "stats.vBucks": user.stats.vBucks,
                    [`collections.outfitStats.${outfitId}`]: outfitStats
                }
            });
        }
        res.redirect("/battle");
    }
    catch (error) {
        console.error("Battle route error:", error);
        res.status(500).send("Fout bij het bijwerken van battle statistieken");
    }
}));
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
app.post("/random", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const outfits = yield database_1.cosmeticsCollection.find({ "type.value": "outfit" }).toArray();
        const pickaxes = yield database_1.cosmeticsCollection.find({ "type.value": "pickaxe" }).toArray();
        const emotes = yield database_1.cosmeticsCollection.find({ "type.value": "emote" }).toArray();
        const backpacks = yield database_1.cosmeticsCollection.find({ "type.value": "backpack" }).toArray();
        const getRandomItem = (items) => {
            const randomIndex = Math.floor(Math.random() * items.length);
            return items[randomIndex];
        };
        const randomOutfit = getRandomItem(outfits);
        const randomPickaxe = getRandomItem(pickaxes);
        const randomEmote = getRandomItem(emotes);
        const randomBackpack = getRandomItem(backpacks);
        yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
            $set: {
                "equipped.outfit": { item: randomOutfit, id: randomOutfit.id },
                "equipped.weapon": { item: randomPickaxe, id: randomPickaxe.id },
                "equipped.emote": { item: randomEmote, id: randomEmote.id },
                "equipped.backpack": { item: randomBackpack, id: randomBackpack.id }
            }
        });
        res.redirect("/locker");
    }
    catch (error) {
        console.error("Error randomizing items:", error);
        res.status(500).send("Error randomizing items");
    }
}));
app.post("/setfavorite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }
        const currentOutfit = JSON.parse(req.body.currentOutfit);
        if (!currentOutfit || !((_a = currentOutfit.images) === null || _a === void 0 ? void 0 : _a.smallIcon)) {
            return res.status(400).send("Geen geldig huidig outfit gevonden");
        }
        const smallIcon = currentOutfit.images.smallIcon;
        console.log("Setting profile picture to:", smallIcon);
        const isAlreadyFavorite = (_c = (_b = user.collections) === null || _b === void 0 ? void 0 : _b.favorites) === null || _c === void 0 ? void 0 : _c.some((fav) => fav.id === currentOutfit.id);
        if (!isAlreadyFavorite) {
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                $set: { currentPfp: smallIcon },
                $push: { "collections.favorites": currentOutfit }
            });
        }
        else {
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, { $set: { currentPfp: smallIcon } });
        }
        res.redirect("/locker");
    }
    catch (error) {
        console.error("Error setting profile picture:", error);
        res.status(500).send("Fout bij het instellen van profielfoto");
    }
}));
app.post("/showinfo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
app.get("/lockerdetails", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shopItems = yield database_1.shopCollection.find({}).toArray();
        const shopItemIds = new Set(shopItems.flatMap(entry => (entry.brItems || []).map((item) => item.id)));
        const cosmetics = yield database_1.cosmeticsCollection.find({}).toArray();
        const uniqueFavorites = Array.from(new Map((res.locals.favorites || []).map((item) => [item.id, item])).values());
        const uniqueBlacklisted = Array.from(new Map((res.locals.blacklisted || []).map((item) => [item.id, item])).values());
        const uniqueBoughtItems = Array.from(new Map((res.locals.boughtItems || []).map((item) => [item.id, item])).values());
        const getAvailableItems = (type) => {
            return cosmetics.filter(item => item.type.value === type &&
                !uniqueFavorites.some((fav) => fav.id === item.id) &&
                !uniqueBlacklisted.some((bl) => bl.id === item.id) &&
                !shopItemIds.has(item.id));
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
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Error loading data");
    }
}));
app.post("/lockerdetails", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }
        if (req.body.favorite) {
            const item = JSON.parse(req.body.favorite);
            if (!((_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.favorites) === null || _b === void 0 ? void 0 : _b.some((fav) => fav.id === item.id))) {
                const updatedFavorites = [...(((_c = user.collections) === null || _c === void 0 ? void 0 : _c.favorites) || []), item];
                const updatedBoughtItems = (((_d = user.collections) === null || _d === void 0 ? void 0 : _d.boughtItems) || []).filter((bought) => bought.id !== item.id);
                yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                    $set: {
                        "collections.favorites": updatedFavorites,
                        "collections.boughtItems": updatedBoughtItems
                    }
                });
                res.locals.favorites = updatedFavorites;
                res.locals.boughtItems = updatedBoughtItems;
            }
        }
        if (req.body.blacklisted) {
            const item = JSON.parse(req.body.blacklisted);
            if (!((_f = (_e = user.collections) === null || _e === void 0 ? void 0 : _e.blacklisted) === null || _f === void 0 ? void 0 : _f.some((bl) => bl.id === item.id))) {
                const updatedFavorites = (((_g = user.collections) === null || _g === void 0 ? void 0 : _g.favorites) || []).filter((fav) => fav.id !== item.id);
                const updatedBoughtItems = (((_h = user.collections) === null || _h === void 0 ? void 0 : _h.boughtItems) || []).filter((bought) => bought.id !== item.id);
                const updatedBlacklisted = [...(((_j = user.collections) === null || _j === void 0 ? void 0 : _j.blacklisted) || []), item];
                const updatedOutfitStats = Object.assign({}, ((_k = user.collections) === null || _k === void 0 ? void 0 : _k.outfitStats) || {});
                updatedOutfitStats[item.id] = { wins: 0, losses: 0 };
                yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                    $set: {
                        "collections.favorites": updatedFavorites,
                        "collections.boughtItems": updatedBoughtItems,
                        "collections.blacklisted": updatedBlacklisted,
                        "collections.outfitStats": updatedOutfitStats,
                        [`collections.blacklistReasons.${item.id}`]: "Personage trekt op niets"
                    }
                });
                res.locals.favorites = updatedFavorites;
                res.locals.boughtItems = updatedBoughtItems;
                res.locals.blacklisted = updatedBlacklisted;
                return res.redirect(`/item/${item.id}/blacklisted`);
            }
        }
        res.redirect("/lockerdetails");
    }
    catch (e) {
        console.error("Error in lockerdetails POST:", e);
        res.status(500).send("Fout bij het verwerken van het verzoek");
    }
}));
app.post("/remove-favorite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const itemId = req.body.itemId;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }
        const item = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.favorites) === null || _b === void 0 ? void 0 : _b.find((fav) => fav.id === itemId);
        if (item) {
            const updatedFavorites = (((_c = user.collections) === null || _c === void 0 ? void 0 : _c.favorites) || []).filter((fav) => fav.id !== itemId);
            const shopItems = yield database_1.shopCollection.find({}).toArray();
            const isFromShop = shopItems.some(shopItem => { var _a; return (_a = shopItem.brItems) === null || _a === void 0 ? void 0 : _a.some((brItem) => brItem.id === itemId); });
            let updatedBoughtItems = ((_d = user.collections) === null || _d === void 0 ? void 0 : _d.boughtItems) || [];
            if (isFromShop) {
                updatedBoughtItems = [...updatedBoughtItems, item];
            }
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                $set: {
                    "collections.favorites": updatedFavorites,
                    "collections.boughtItems": updatedBoughtItems
                }
            });
            res.locals.favorites = updatedFavorites;
            res.locals.boughtItems = updatedBoughtItems;
        }
        res.redirect("/lockerdetails");
    }
    catch (e) {
        console.error("Error in remove-favorite POST:", e);
        res.status(500).send("Fout bij het verwijderen van favoriet");
    }
}));
app.post("/remove-blacklisted", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const itemId = req.body.itemId;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }
        const item = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.blacklisted) === null || _b === void 0 ? void 0 : _b.find((bl) => bl.id === itemId);
        if (item) {
            const updatedBlacklisted = (((_c = user.collections) === null || _c === void 0 ? void 0 : _c.blacklisted) || []).filter((bl) => bl.id !== itemId);
            const shopItems = yield database_1.shopCollection.find({}).toArray();
            const isFromShop = shopItems.some(shopItem => { var _a; return (_a = shopItem.brItems) === null || _a === void 0 ? void 0 : _a.some((brItem) => brItem.id === itemId); });
            let updatedBoughtItems = ((_d = user.collections) === null || _d === void 0 ? void 0 : _d.boughtItems) || [];
            if (isFromShop) {
                updatedBoughtItems = [...updatedBoughtItems, item];
            }
            const updatedBlacklistReasons = Object.assign({}, (_e = user.collections) === null || _e === void 0 ? void 0 : _e.blacklistReasons);
            delete updatedBlacklistReasons[itemId];
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
                $set: {
                    "collections.blacklisted": updatedBlacklisted,
                    "collections.boughtItems": updatedBoughtItems,
                    "collections.blacklistReasons": updatedBlacklistReasons
                }
            });
            res.locals.blacklisted = updatedBlacklisted;
            res.locals.boughtItems = updatedBoughtItems;
        }
        res.redirect("/lockerdetails");
    }
    catch (e) {
        console.error("Error in remove-blacklisted POST:", e);
        res.status(500).send("Fout bij het verwijderen van zwarte lijst item");
    }
}));
app.get("/item/:id", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { id } = req.params;
    try {
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }
        const isBlacklisted = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.blacklisted) === null || _b === void 0 ? void 0 : _b.some((bl) => bl.id === id);
        if (isBlacklisted) {
            return res.redirect(`/item/${id}/blacklisted`);
        }
        let item = yield database_1.cosmeticsCollection.findOne({ id });
        if (!item) {
            const shopItems = yield database_1.shopCollection.find({}).toArray();
            for (const shopItem of shopItems) {
                const foundItem = (_c = shopItem.brItems) === null || _c === void 0 ? void 0 : _c.find((brItem) => brItem.id === id);
                if (foundItem) {
                    item = Object.assign(Object.assign({}, foundItem), { finalPrice: shopItem.finalPrice, isBought: ((_e = (_d = user.collections) === null || _d === void 0 ? void 0 : _d.boughtItems) === null || _e === void 0 ? void 0 : _e.some((bought) => bought.id === id)) ||
                            ((_g = (_f = user.collections) === null || _f === void 0 ? void 0 : _f.favorites) === null || _g === void 0 ? void 0 : _g.some((fav) => fav.id === id)) ||
                            ((_j = (_h = user.collections) === null || _h === void 0 ? void 0 : _h.blacklisted) === null || _j === void 0 ? void 0 : _j.some((bl) => bl.id === id)) });
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
    }
    catch (e) {
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
}));
app.get("/item/:id/edit", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const itemId = req.params.id;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }
        let item = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.boughtItems) === null || _b === void 0 ? void 0 : _b.find((bought) => bought.id === itemId);
        if (!item) {
            item = yield database_1.cosmeticsCollection.findOne({ id: itemId });
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
    }
    catch (error) {
        console.error("Error loading edit page:", error);
        res.status(500).send("Fout bij het laden van de bewerkingspagina");
    }
}));
app.post("/item/:id/edit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const itemId = req.params.id;
        const { description } = req.body;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }
        const boughtItemIndex = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.boughtItems) === null || _b === void 0 ? void 0 : _b.findIndex((bought) => bought.id === itemId);
        if (boughtItemIndex !== -1 && boughtItemIndex !== undefined) {
            yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, { $set: { [`collections.boughtItems.${boughtItemIndex}.description`]: description } });
        }
        else {
            yield database_1.cosmeticsCollection.updateOne({ id: itemId }, { $set: { description } });
        }
        res.redirect(`/item/${itemId}`);
    }
    catch (error) {
        console.error("Error saving description:", error);
        res.status(500).send("Fout bij het opslaan van de beschrijving");
    }
}));
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
app.post("/equip-item", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }
        const itemId = req.body.itemId;
        const itemType = req.body.itemType;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }
        let item;
        if ((_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.favorites) === null || _b === void 0 ? void 0 : _b.some((fav) => fav.id === itemId)) {
            item = user.collections.favorites.find((fav) => fav.id === itemId);
        }
        else if ((_d = (_c = user.collections) === null || _c === void 0 ? void 0 : _c.boughtItems) === null || _d === void 0 ? void 0 : _d.some((bought) => bought.id === itemId)) {
            item = user.collections.boughtItems.find((bought) => bought.id === itemId);
        }
        else {
            item = yield database_1.cosmeticsCollection.findOne({ id: itemId });
        }
        if (!item) {
            return res.status(404).send("Item niet gevonden");
        }
        const dbField = itemType === 'pickaxe' ? 'weapon' : itemType;
        yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, {
            $set: {
                [`equipped.${dbField}`]: { item, id: item.id }
            }
        });
        res.redirect("/lockerdetails");
    }
    catch (e) {
        console.error("Error equipping item:", e);
        res.status(500).send("Fout bij het uitrusten van item");
    }
}));
app.get("/item/:id/blacklisted", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }
        const blacklistedItem = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.blacklisted) === null || _b === void 0 ? void 0 : _b.find((bl) => bl.id === id);
        if (!blacklistedItem) {
            return res.redirect("/lockerdetails");
        }
        const blacklistReason = ((_d = (_c = user.collections) === null || _c === void 0 ? void 0 : _c.blacklistReasons) === null || _d === void 0 ? void 0 : _d[id]) || '';
        res.render("blacklisted", {
            title: "Zwarte Lijst Item",
            style: "blacklisted",
            path: `/item/${id}/blacklisted`,
            item: blacklistedItem,
            blacklistReason
        });
    }
    catch (error) {
        console.error("Error loading blacklisted page:", error);
        res.status(500).send("Fout bij het laden van de zwarte lijst pagina");
    }
}));
app.post("/item/:id/blacklisted", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const user = yield database_1.users.findOne({ _id: new mongodb_1.ObjectId(req.session.userId) });
        if (!user) {
            return res.redirect("/login");
        }
        const isBlacklisted = (_b = (_a = user.collections) === null || _a === void 0 ? void 0 : _a.blacklisted) === null || _b === void 0 ? void 0 : _b.some((bl) => bl.id === id);
        if (!isBlacklisted) {
            return res.redirect("/lockerdetails");
        }
        yield database_1.users.updateOne({ _id: new mongodb_1.ObjectId(req.session.userId) }, { $set: { [`collections.blacklistReasons.${id}`]: reason } });
        res.redirect(`/item/${id}/blacklisted`);
    }
    catch (error) {
        console.error("Error saving blacklist reason:", error);
        res.status(500).send("Fout bij het opslaan van de reden");
    }
}));
app.listen(app.get("port"), () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connect)();
    console.log("Server started on http://localhost:" + app.get("port"));
}));
