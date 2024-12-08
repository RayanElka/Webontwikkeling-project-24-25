import express, { Request, Response } from "express";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";

// Initialize Express
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));

// MongoDB connectie-instellingen
const url = "mongodb+srv://Rayan:s131022@webontwikkeling.s378ort.mongodb.net/";
const dbName = "expense-manager";
let db: any;

// Verbind met MongoDB
const connectToDatabase = async () => {
  try {
    const client = await MongoClient.connect(url);
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

// Set up view engine to use EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse incoming request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (for CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Route: Homepagina
// Route: Homepagina
app.get("/", async (req: Request, res: Response) => {
  try {
    const users = await db.collection("users").find().toArray();
    const expenses = await db.collection("expenses").find().toArray();
    res.render("index", { users, expenses });
  } catch (err) {
    console.error("Error fetching data", err);
    res.status(500).send("Error fetching data");
  }
});

// Route: Kosten toevoegen (formulier voor uitgaven)
app.get("/add-expense", (req: Request, res: Response) => {
  res.render("add-expense");
});

// Route: Verwerk de toevoeging van een nieuwe uitgave
app.post("/add-expense", async (req: Request, res: Response) => {
  const {
    userId,
    beschrijving,
    bedrag,
    datum,
    valuta,
    betaalmethode,
    categorie,
    tags,
    betaald,
  } = req.body;

  const newExpense = {
    beschrijving,
    bedrag: parseFloat(bedrag),
    datum: new Date(datum),
    valuta,
    betaalmethode, // direct gebruiken zonder JSON.parse()
    categorie,
    tags: tags.split(","), // tags omzetten naar array
    betaald: betaald === "true", // zorg ervoor dat "true" een boolean wordt
    userId: userId, // Voeg userId toe aan de uitgave
  };

  try {
    await db.collection("expenses").insertOne(newExpense);
    res.redirect("/");
  } catch (err) {
    console.error("Error adding expense", err);
    res.status(500).send("Error adding expense");
  }
});

// Route: Bewerk een uitgave (toon formulier)
app.get("/edit-expense/:id", async (req: Request, res: Response) => {
  const expenseId = req.params.id;
  try {
    const expense = await db
      .collection("expenses")
      .findOne({ _id: new ObjectId(expenseId) });
    if (!expense) {
      return res.status(404).send("Expense not found");
    }
    res.render("edit-expense", { expense });
  } catch (err) {
    console.error("Error fetching expense for editing", err);
    res.status(500).send("Error fetching expense");
  }
});

// Route: Verwerk bewerkte uitgave
app.post("/edit-expense/:id", async (req: Request, res: Response) => {
  const expenseId = req.params.id;
  const {
    beschrijving,
    bedrag,
    datum,
    valuta,
    betaalmethode,
    categorie,
    tags,
    betaald,
  } = req.body;

  // Maak het object voor de bewerkte uitgave
  const updatedExpense = {
    beschrijving,
    bedrag: parseFloat(bedrag),
    datum: new Date(datum),
    valuta,
    betaalmethode, // direct gebruiken zonder JSON.parse()
    categorie,
    tags: tags.split(","), // tags omzetten naar array
    betaald: betaald === "true", // zorg ervoor dat "true" een boolean wordt
  };

  try {
    // Werk de uitgave bij in de database
    const result = await db
      .collection("expenses")
      .updateOne({ _id: new ObjectId(expenseId) }, { $set: updatedExpense });

    // Als er geen wijzigingen zijn, stuur een foutmelding
    if (result.modifiedCount === 0) {
      return res.status(404).send("Expense not found or no changes made");
    }
    // Redirect naar de hoofdpagina na succesvolle update
    res.redirect("/");
  } catch (err) {
    console.error("Error editing expense", err);
    res.status(500).send("Error editing expense");
  }
});

// Start de server
const startServer = async () => {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
