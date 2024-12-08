import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";

export const expenseRoutes = (db: any) => {
  const router = Router();

  // Add expense form
  router.get("/add-expense/:userId", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    res.render("add-expense", { user });
  });

  // Add expense POST request
  router.post("/add-expense/:userId", async (req: Request, res: Response) => {
    const { description, amount, currency, category, tags } = req.body;
    const tagsArray = tags
      ? tags.split(",").map((tag: string) => tag.trim())
      : [];
    const expense = {
      description,
      amount: parseFloat(amount),
      currency,
      category,
      tags: tagsArray,
      date: new Date(),
    };

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.params.userId) },
        { $push: { expenses: expense } }
      );

    res.redirect("/");
  });

  // Edit expense form
  router.get(
    "/edit-expense/:userId/:expenseId",
    async (req: Request, res: Response) => {
      const { userId, expenseId } = req.params;
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      const expense = user.expenses.find(
        (exp: any) => exp._id.toString() === expenseId
      );
      res.render("edit-expense", { user, expense });
    }
  );

  // Update expense
  router.post(
    "/edit-expense/:userId/:expenseId",
    async (req: Request, res: Response) => {
      const { userId, expenseId } = req.params;
      const { description, amount, currency, category, tags } = req.body;
      const tagsArray = tags
        ? tags.split(",").map((tag: string) => tag.trim())
        : [];

      const updatedExpense = {
        description,
        amount: parseFloat(amount),
        currency,
        category,
        tags: tagsArray,
        date: new Date(),
      };

      await db
        .collection("users")
        .updateOne(
          {
            _id: new ObjectId(userId),
            "expenses._id": new ObjectId(expenseId),
          },
          { $set: { "expenses.$": updatedExpense } }
        );

      res.redirect("/");
    }
  );

  // Delete expense
  router.post(
    "/delete-expense/:userId/:expenseId",
    async (req: Request, res: Response) => {
      const { userId, expenseId } = req.params;

      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $pull: { expenses: { _id: new ObjectId(expenseId) } } }
        );

      res.redirect("/");
    }
  );

  return router;
};
