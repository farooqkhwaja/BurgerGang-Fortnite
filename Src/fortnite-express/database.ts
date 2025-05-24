import { Collection, MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { Fortnite } from './types';

dotenv.config();

const CONNECTION_STRING = process.env.CONNECTION_STRING || "mongodb+srv://FortniteBurgerGang:<db_password>@fortniteproject.qmf7jfb.mongodb.net/?retryWrites=true&w=majority&appName=FortniteProject";

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
export const equippedOutfitCollection: Collection<any> = client.db("FortniteProject").collection("equippedOutfit");
export const equippedWeaponCollection: Collection<any> = client.db("FortniteProject").collection("equippedWeapon");
export const equippedEmoteCollection: Collection<any> = client.db("FortniteProject").collection("equippedEmote");

async function seed() {
    try {
        let cosmetics: any[] = [];
        let news: any[] = [];
        let shop: any[] = [];
        let boughtItems: any[] = [];
        let favorites: any[] = [];
        let blacklisted: any[] = [];
        let equippedOutfit: any[] = [];
        let equippedWeapon: any[] = [];
        let equippedEmote: any[] = [];


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

    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

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