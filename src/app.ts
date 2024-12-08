import express, { Request, Response } from "express";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = 3000;

const url = "mongodb+srv://Rayan:s131022@webontwikkeling.s378ort.mongodb.net/";
const dbName = "expense-manager";
let db: any;

const connectToDatabase = async () => {
  try {
    const client = await MongoClient.connect(url);
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.get("/add-expense", (req: Request, res: Response) => {
  res.render("add-expense");
});

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
    betaalmethode,
    categorie,
    tags: tags.split(","),
    betaald: betaald === "true",
    userId: userId,
  };

  try {
    await db.collection("expenses").insertOne(newExpense);
    res.redirect("/");
  } catch (err) {
    console.error("Error adding expense", err);
    res.status(500).send("Error adding expense");
  }
});

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

  const updatedExpense = {
    beschrijving,
    bedrag: parseFloat(bedrag),
    datum: new Date(datum),
    valuta,
    betaalmethode,
    categorie,
    tags: tags.split(","),
    betaald: betaald === "true",
  };

  try {
    const result = await db
      .collection("expenses")
      .updateOne({ _id: new ObjectId(expenseId) }, { $set: updatedExpense });

    if (result.modifiedCount === 0) {
      return res.status(404).send("Expense not found or no changes made");
    }
    res.redirect("/");
  } catch (err) {
    console.error("Error editing expense", err);
    res.status(500).send("Error editing expense");
  }
});

const startServer = async () => {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
