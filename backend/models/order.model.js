import mongoose from "mongoose";

const itemFields = {
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  price: Number,
  quantity: Number,
};

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },

    items: [itemFields],
    totalAmount: { type: Number, required: true },
    paystackReference: { type: String, required: true, unique: true },


    orderStatus: {
      type: String,
      enum: ["unconfirmed", "confirmed"],
    },
    expiresAt: Date, // when the stock hold ends


    refundItems: [itemFields],
    refundAmount: { type: Number, default: 0 },

    deliveryStatus: {
      type: String,
      enum: ["pending", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Lets the cron job quickly find unconfirmed orders past their deadline
orderSchema.index({ orderStatus: 1, expiresAt: 1 });

export default mongoose.model("Order", orderSchema);