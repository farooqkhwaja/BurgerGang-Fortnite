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
exports.createUser = exports.users = exports.equippedCollection = exports.blacklistedCollection = exports.favoritesCollection = exports.boughtItemsCollection = exports.shopCollection = exports.newsCollection = exports.cosmeticsCollection = void 0;
exports.connect = connect;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
const CONNECTION_STRING = process.env.CONNECTION_STRING || "mongodb+srv://FortniteBurgerGang:Division_1_Gooners@fortniteproject.qmf7jfb.mongodb.net/?retryWrites=true&w=majority&appName=FortniteProject";
if (!CONNECTION_STRING) {
    throw new Error('CONNECTION_STRING is not defined');
}
const client = new mongodb_1.MongoClient(CONNECTION_STRING);
exports.cosmeticsCollection = client.db("FortniteProject").collection("cosmetics");
exports.newsCollection = client.db("FortniteProject").collection("news");
exports.shopCollection = client.db("FortniteProject").collection("shop");
exports.boughtItemsCollection = client.db("FortniteProject").collection("boughtItems");
exports.favoritesCollection = client.db("FortniteProject").collection("favorites");
exports.blacklistedCollection = client.db("FortniteProject").collection("blacklisted");
exports.equippedCollection = client.db("FortniteProject").collection("equipped");
exports.users = client.db("FortniteProject").collection("users");
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            let cosmetics = [];
            let news = [];
            let shop = [];
            const cosmeticsResponse = yield fetch("https://fortnite-api.com/v2/cosmetics/new");
            const cosmeticsJson = yield cosmeticsResponse.json();
            if ((_b = (_a = cosmeticsJson.data) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.br) {
                cosmetics = cosmeticsJson.data.items.br;
                cosmetics = cosmetics.filter(item => { var _a; return (_a = item.images) === null || _a === void 0 ? void 0 : _a.featured; });
            }
            const newsResponse = yield fetch("https://fortnite-api.com/v2/news/br");
            const newsJson = yield newsResponse.json();
            if ((_c = newsJson.data) === null || _c === void 0 ? void 0 : _c.motds) {
                news = newsJson.data.motds;
            }
            const shopResponse = yield fetch("https://fortnite-api.com/v2/shop");
            const shopJson = yield shopResponse.json();
            if ((_d = shopJson.data) === null || _d === void 0 ? void 0 : _d.entries) {
                shop = shopJson.data.entries;
            }
            if ((yield exports.cosmeticsCollection.countDocuments()) === 0) {
                yield exports.cosmeticsCollection.insertMany(cosmetics);
                console.log("Updated cosmetics collection");
            }
            if ((yield exports.newsCollection.countDocuments()) === 0) {
                yield exports.newsCollection.insertMany(news);
                console.log("Updated news collection");
            }
            if ((yield exports.shopCollection.countDocuments()) === 0) {
                yield exports.shopCollection.insertMany(shop);
                console.log("Updated shop collection");
            }
            yield initializeUsers();
        }
        catch (error) {
            console.error("Error seeding database:", error);
        }
    });
}
function initializeUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
            const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
            const adminUsername = process.env.ADMIN_USERNAME || "admin";
            const adminExists = yield exports.users.findOne({ email: adminEmail });
            if (!adminExists) {
                yield (0, exports.createUser)(adminEmail, adminPassword, adminUsername);
                yield exports.users.updateOne({ email: adminEmail }, { $set: { role: "ADMIN" } });
                console.log("Default admin user created");
            }
        }
        catch (error) {
            console.error("Error creating default users:", error);
        }
    });
}
const createUser = (email, password, username) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield exports.users.findOne({ email });
    if (existingUser) {
        throw new Error("Email already in use");
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const newUser = {
        email,
        password: hashedPassword,
        username,
        currentPfp: null,
        stats: {
            vBucks: 1000
        },
        equipped: {
            outfit: {
                item: null,
                id: null
            },
            weapon: {
                item: null,
                id: null
            },
            emote: {
                item: null,
                id: null
            },
            backpack: {
                item: null,
                id: null
            }
        },
        collections: {
            favorites: [],
            blacklisted: [],
            boughtItems: [],
            outfitStats: {}
        }
    };
    const result = yield exports.users.insertOne(newUser);
    return result;
});
exports.createUser = createUser;
function exit() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.close();
            console.log("Disconnected from database");
        }
        catch (error) {
            console.error(error);
        }
        process.exit(0);
    });
}
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Connected to database");
            yield seed();
            process.on("SIGINT", exit);
        }
        catch (error) {
            console.error(error);
        }
    });
}
