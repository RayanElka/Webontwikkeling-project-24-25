import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// MongoDB connectie-instellingen
const url = "mongodb+srv://Rayan:s131022@webontwikkeling.s378ort.mongodb.net/";
const dbName = "expense-manager";

// Het pad naar het bestand `users.json` in de `json` map
const usersFilePath = path.join(__dirname, "json", "gebruikers.json");

// Lees de gebruikersdata uit de JSON
const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));

const migrateUsers = async () => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    // Verwijder bestaande gebruikers in de collectie (optioneel)
    await usersCollection.deleteMany({});

    // Voeg de gebruikers toe aan de collectie
    const result = await usersCollection.insertMany(usersData);
    console.log(`${result.insertedCount} users were inserted`);
  } catch (err) {
    console.error("Error migrating users", err);
  } finally {
    await client.close();
  }
};

// Voer de migratie uit
migrateUsers();
