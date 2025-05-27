import { Collection, MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { Fortnite } from './types';
import bcrypt from 'bcrypt';

dotenv.config();

const CONNECTION_STRING = process.env.CONNECTION_STRING || "mongodb+srv://FortniteBurgerGang:Division_1_Gooners@fortniteproject.qmf7jfb.mongodb.net/?retryWrites=true&w=majority&appName=FortniteProject";

if (!CONNECTION_STRING) {
    throw new Error('CONNECTION_STRING is not defined');
}

const client = new MongoClient(CONNECTION_STRING);
export const cosmeticsCollection: Collection<any> = client.db("FortniteProject").collection("cosmetics");
export const newsCollection: Collection<any> = client.db("FortniteProject").collection("news");
export const shopCollection: Collection<any> = client.db("FortniteProject").collection("shop");
export const boughtItemsCollection: Collection<any> = client.db("FortniteProject").collection("boughtItems");
export const favoritesCollection: Collection<any> = client.db("FortniteProject").collection("favorites");
export const blacklistedCollection: Collection<any> = client.db("FortniteProject").collection("blacklisted");
export const equippedCollection: Collection<any> = client.db("FortniteProject").collection("equipped");
export const users: Collection<any> = client.db("FortniteProject").collection("users")

async function seed() {
    try {
        let cosmetics: any[] = [];
        let news: any[] = [];
        let shop: any[] = [];

        const cosmeticsResponse = await fetch("https://fortnite-api.com/v2/cosmetics/new");
        const cosmeticsJson: Fortnite = await cosmeticsResponse.json();
        if (cosmeticsJson.data?.items?.br) {
            cosmetics = cosmeticsJson.data.items.br;
            cosmetics = cosmetics.filter(item => item.images?.featured);
        }

        const newsResponse = await fetch("https://fortnite-api.com/v2/news/br");
        const newsJson = await newsResponse.json();
        if (newsJson.data?.motds) {
            news = newsJson.data.motds;
        }

        const shopResponse = await fetch("https://fortnite-api.com/v2/shop");
        const shopJson = await shopResponse.json();
        if (shopJson.data?.entries) {
            shop = shopJson.data.entries;
        }

        if ((await cosmeticsCollection.countDocuments()) === 0) {
            await cosmeticsCollection.insertMany(cosmetics);
            console.log("Updated cosmetics collection");

        }
        if ((await newsCollection.countDocuments()) === 0) {
            await newsCollection.insertMany(news);
            console.log("Updated news collection");
        }
        if (await shopCollection.countDocuments() === 0) {
            await shopCollection.insertMany(shop);
            console.log("Updated shop collection");
        }

        await initializeUsers()


    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

async function initializeUsers() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com"
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
        const adminUsername = process.env.ADMIN_USERNAME || "admin"

        const adminExists = await users.findOne({ email: adminEmail })
        if (!adminExists) {
            await createUser(adminEmail, adminPassword, adminUsername)
            await users.updateOne(
                { email: adminEmail },
                { $set: { role: "ADMIN" } }
            )
            console.log("Default admin user created")
        }

    } catch (error) {
        console.error("Error creating default users:", error)
    }
}

export const createUser = async (email: string, password: string, username: string) => {
    const existingUser = await users.findOne({ email });
    if (existingUser) {
        throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    const result = await users.insertOne(newUser);
    return result;
};

async function exit() {
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export async function connect() {
    try {
        await client.connect();
        console.log("Connected to database");
        await seed();
        process.on("SIGINT", exit);
    } catch (error) {
        console.error(error);
    }
}