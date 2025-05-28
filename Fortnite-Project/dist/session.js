"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const MongoDBStore = (0, connect_mongodb_session_1.default)(express_session_1.default);
dotenv_1.default.config();
const mongoStore = new MongoDBStore({
    uri: (_a = process.env.CONNECTION_STRING) !== null && _a !== void 0 ? _a : "mongodb+srv://FortniteBurgerGang:Division_1_Gooners@fortniteproject.qmf7jfb.mongodb.net/?retryWrites=true&w=majority&appName=FortniteProject",
    collection: "sessions",
    databaseName: "FortniteProject",
});
mongoStore.on("error", (error) => {
    console.error("Session store error:", error);
});
exports.default = (0, express_session_1.default)({
    secret: (_b = process.env.SESSION_SECRET) !== null && _b !== void 0 ? _b : "my-super-secret-secret",
    store: mongoStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'strict'
    }
});
