// File: src/app.ts

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { connectToDatabase, getDb } from "./database";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const secretKey: string = process.env.JWT_SECRET || "default_secret";

// Extend Request to include user
interface JwtPayload {
  id: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Helper function to authenticate users
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect("/login?message=Log opnieuw in.");
  }

  try {
    const decoded = jwt.verify(token, secretKey) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.clearCookie("token"); // Wis de verlopen token
      return res.redirect("/login?message=Sessie verlopen. Log opnieuw in.");
    }
    console.error("JWT verification error:", err);
    return res.redirect("/login");
  }
};

// Middleware for input validation
const validateExpenseInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { beschrijving, bedrag, datum, valuta, betaalmethode, categorie } =
    req.body;
  if (
    !beschrijving ||
    !bedrag ||
    !datum ||
    !valuta ||
    !betaalmethode ||
    !categorie
  ) {
    return res.status(400).send("Missing required fields for expense.");
  }
  next();
};

const validateIncomeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { beschrijving, bedrag, datum, valuta } = req.body;
  if (!beschrijving || !bedrag || !datum || !valuta) {
    return res.status(400).send("Missing required fields for income.");
  }
  next();
};

// ------------------------ HOMEPAGE ------------------------
app.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const [users, expenses, income] = await Promise.all([
      db.collection("users").find().toArray(),
      db.collection("expenses").find({ userId: req.user?.id }).toArray(),
      db.collection("income").find({ userId: req.user?.id }).toArray(),
    ]);
    res.render("index", {
      users,
      expenses,
      income,
      message: req.query.message,
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Error fetching data.");
  }
});

// ------------------------ EXPENSE ROUTES ------------------------
app.get("/add-expense", authenticateJWT, (req: Request, res: Response) => {
  res.render("add-expense", { message: req.query.message });
});

app.post(
  "/add-expense",
  authenticateJWT,
  validateExpenseInput,
  async (req: Request, res: Response) => {
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
    const newExpense = {
      beschrijving,
      bedrag: parseFloat(bedrag),
      datum: new Date(datum),
      valuta,
      betaalmethode,
      categorie,
      tags: tags.split(",").map((tag: string) => tag.trim()),
      betaald: betaald === "true",
      userId: req.user?.id,
    };

    try {
      const db = getDb();
      await db.collection("expenses").insertOne(newExpense);
      res.redirect("/?message=Uitgave succesvol toegevoegd.");
    } catch (err) {
      console.error("Error adding expense:", err);
      res.status(500).send("Error adding expense.");
    }
  }
);

app.get(
  "/edit-expense/:id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const expense = await db
        .collection("expenses")
        .findOne({ _id: new ObjectId(req.params.id), userId: req.user?.id });
      if (!expense) return res.status(404).send("Expense not found.");
      res.render("edit-expense", { expense });
    } catch (err) {
      console.error("Error fetching expense for editing:", err);
      res.status(500).send("Error fetching expense.");
    }
  }
);

app.post(
  "/edit-expense/:id",
  authenticateJWT,
  validateExpenseInput,
  async (req: Request, res: Response) => {
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
      tags: tags.split(",").map((tag: string) => tag.trim()),
      betaald: betaald === "true",
    };

    try {
      const db = getDb();
      const result = await db
        .collection("expenses")
        .updateOne(
          { _id: new ObjectId(req.params.id), userId: req.user?.id },
          { $set: updatedExpense }
        );

      if (result.modifiedCount === 0) {
        return res.status(404).send("Expense not found or no changes made.");
      }
      res.redirect("/?message=Uitgave succesvol bijgewerkt.");
    } catch (err) {
      console.error("Error updating expense:", err);
      res.status(500).send("Error updating expense.");
    }
  }
);

app.post(
  "/delete-expense/:id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const result = await db
        .collection("expenses")
        .deleteOne({ _id: new ObjectId(req.params.id), userId: req.user?.id });

      if (result.deletedCount === 0) {
        return res.status(404).send("Expense not found.");
      }
      res.redirect("/?message=Uitgave succesvol verwijderd.");
    } catch (err) {
      console.error("Error deleting expense:", err);
      res.status(500).send("Error deleting expense.");
    }
  }
);

// ------------------------ INCOME ROUTES ------------------------
app.get("/add-income", authenticateJWT, (req: Request, res: Response) => {
  res.render("add-income", { message: req.query.message });
});
app.post(
  "/add-income",
  authenticateJWT,
  validateIncomeInput,
  async (req: Request, res: Response) => {
    const { beschrijving, bedrag, datum, valuta, categorie } = req.body;
    const newIncome = {
      beschrijving,
      bedrag: parseFloat(bedrag),
      datum: new Date(datum),
      valuta,
      categorie,
      userId: req.user?.id,
    };

    try {
      const db = getDb();
      await db.collection("income").insertOne(newIncome);
      res.redirect("/?message=Inkomen succesvol toegevoegd.");
    } catch (err) {
      console.error("Error adding income:", err);
      res.status(500).send("Error adding income.");
    }
  }
);

app.post(
  "/delete-income/:id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const result = await db
        .collection("income")
        .deleteOne({ _id: new ObjectId(req.params.id), userId: req.user?.id });

      if (result.deletedCount === 0) {
        return res.status(404).send("Income not found.");
      }
      res.redirect("/?message=Inkomen succesvol verwijderd.");
    } catch (err) {
      console.error("Error deleting income:", err);
      res.status(500).send("Error deleting income.");
    }
  }
);

app.get(
  "/edit-income/:id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const income = await db
        .collection("income")
        .findOne({ _id: new ObjectId(req.params.id), userId: req.user?.id });

      if (!income) {
        return res.status(404).send("Income not found.");
      }

      res.render("edit-income", { income });
    } catch (err) {
      console.error("Error fetching income for editing:", err);
      res.status(500).send("Error fetching income.");
    }
  }
);

app.post(
  "/edit-income/:id",
  authenticateJWT,
  validateIncomeInput,
  async (req: Request, res: Response) => {
    const { beschrijving, bedrag, datum, valuta, categorie } = req.body;

    const updatedIncome = {
      beschrijving,
      bedrag: parseFloat(bedrag),
      datum: new Date(datum),
      valuta,
      categorie,
    };

    try {
      const db = getDb();
      const result = await db
        .collection("income")
        .updateOne(
          { _id: new ObjectId(req.params.id), userId: req.user?.id },
          { $set: updatedIncome }
        );

      if (result.modifiedCount === 0) {
        return res.status(404).send("Income not found or no changes made.");
      }

      res.redirect("/?message=Inkomen succesvol bijgewerkt.");
    } catch (err) {
      console.error("Error updating income:", err);
      res.status(500).send("Error updating income.");
    }
  }
);

// ------------------------ SEARCH ROUTE ------------------------
app.get("/search", authenticateJWT, async (req: Request, res: Response) => {
  const { query, categorie, minBedrag, maxBedrag, betaald } = req.query;

  try {
    const db = getDb();

    // Filters for expenses
    const expenseFilters: any = { userId: req.user?.id };
    if (query) expenseFilters.beschrijving = { $regex: query, $options: "i" };
    if (categorie) expenseFilters.categorie = categorie;
    if (minBedrag)
      expenseFilters.bedrag = { $gte: parseFloat(minBedrag as string) };
    if (maxBedrag) {
      expenseFilters.bedrag = {
        ...expenseFilters.bedrag,
        $lte: parseFloat(maxBedrag as string),
      };
    }
    if (betaald) expenseFilters.betaald = betaald === "true";

    // Filters for income
    const incomeFilters: any = { userId: req.user?.id };
    if (query) incomeFilters.beschrijving = { $regex: query, $options: "i" };
    if (categorie) incomeFilters.categorie = categorie;
    if (minBedrag)
      incomeFilters.bedrag = { $gte: parseFloat(minBedrag as string) };
    if (maxBedrag) {
      incomeFilters.bedrag = {
        ...incomeFilters.bedrag,
        $lte: parseFloat(maxBedrag as string),
      };
    }

    // Fetch data
    const [expenses, income] = await Promise.all([
      db.collection("expenses").find(expenseFilters).toArray(),
      db.collection("income").find(incomeFilters).toArray(),
    ]);

    // Render filtered results
    res.render("filteredResults", {
      expenses,
      income,
      message: req.query.message,
    });
  } catch (err) {
    console.error("Error searching expenses and income:", err);
    res.status(500).send("Error searching expenses and income.");
  }
});

// ------------------------ LOGIN ROUTES ------------------------
app.get("/login", (req: Request, res: Response) => {
  if (req.cookies?.token) {
    return res.redirect("/");
  }

  res.render("login", { message: req.query.message });
});

app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const db = getDb();
    const user = await db.collection("users").findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .render("login", { message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      secretKey,
      {
        expiresIn: "14d",
      }
    );

    res.cookie("token", token, { httpOnly: true });
    res.redirect("/");
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ------------------------ REGISTER ROUTES ------------------------
app.get("/register", (req: Request, res: Response) => {
  res.render("register", { message: req.query.message });
});

app.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const db = getDb();
    const existingUser = await db.collection("users").findOne({ username });

    if (existingUser) {
      return res
        .status(400)
        .render("register", { message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .collection("users")
      .insertOne({ username, password: hashedPassword });

    res.redirect("/login?message=Registration successful. Please log in.");
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ------------------------ LOGOUT ROUTE ------------------------
app.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.redirect("/login?message=Logged out successfully.");
});

// ------------------------ ERROR HANDLING ------------------------
// 404 Route
app.use((req: Request, res: Response) => {
  res.status(404).render("404", { message: "Page not found." });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler:", err);
  res.status(500).render("error", { message: "An internal error occurred." });
});

// ------------------------ SERVER START ------------------------
connectToDatabase().then(() => {
  app.listen(port, () =>
    console.log(`Server running on http://localhost:${port}`)
  );
});
