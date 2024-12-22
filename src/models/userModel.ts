import { ObjectId } from "mongodb";

export const userModel = {
  id: Number,
  name: String,
  email: String,
  expenses: [
    {
      id: Number,
      description: String,
      amount: Number,
      date: Date,
      currency: String,
      paymentMethod: {
        method: String,
        cardDetails: {
          cardNumber: String,
          expiryDate: String,
        },
        bankAccountNumber: String,
      },
      isIncoming: Boolean,
      category: String,
      tags: [String],
      isPaid: Boolean,
    },
  ],
  budget: {
    monthlyLimit: Number,
    notificationThreshold: Number,
    isActive: Boolean,
  },
};
