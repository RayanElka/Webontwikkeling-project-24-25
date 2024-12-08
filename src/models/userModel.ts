import { ObjectId } from "mongodb";

export interface Expense {
  description: string;
  amount: number;
  currency: string;
  category: string;
  tags: string[];
  date: Date;
}

export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  expenses: Expense[];
  budget: {
    monthlyLimit: number;
    notificationThreshold: number;
    isActive: boolean;
  };
}
