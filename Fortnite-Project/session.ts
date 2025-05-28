import dotenv from "dotenv";
import session from "express-session";
import mongoDbSession from "connect-mongodb-session";

const MongoDBStore = mongoDbSession(session);
dotenv.config();

const mongoStore = new MongoDBStore({
    uri: process.env.CONNECTION_STRING ?? "mongodb+srv://FortniteBurgerGang:Division_1_Gooners@fortniteproject.qmf7jfb.mongodb.net/?retryWrites=true&w=majority&appName=FortniteProject",
    collection: "sessions",
    databaseName: "FortniteProject",
});

mongoStore.on("error", (error) => {
    console.error("Session store error:", error);
});

declare module 'express-session' {
    export interface SessionData {
        userId?: string;
        isAuthenticated?: boolean;
    }
}

export default session({
    secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
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