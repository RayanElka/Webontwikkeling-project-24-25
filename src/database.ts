import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db: Db;

// Verbind met MongoDB
export const connectToDatabase = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Geen MONGO_URI gevonden in .env bestand");
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    db = client.db("expensesApp");
    console.log("Verbonden met MongoDB");
  } catch (err) {
    console.error("Fout bij verbinden met MongoDB:", err);
    process.exit(1); // Stop app als database niet werkt
  }
};

// Export database referentie
export const getDb = (): Db => {
  if (!db) {
    throw new Error("Database is niet verbonden. Roep connectToDatabase aan!");
  }
  return db;
};
