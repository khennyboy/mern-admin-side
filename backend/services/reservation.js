import Order from "../models/order.model.js";
import Product from "../models/product.model.js";


function paymentError(message) {
    const err = new Error(message);
    err.statusCode = 409;
    return err;
}

async function takeItem({ product, quantity }) {
    const res = await Product.updateOne(
        { _id: product, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
    );
    return res.modifiedCount === 1;
}


export async function takeStock(items) {
    const taken = [];
    try {
        for (const item of items) {
            if (!(await takeItem(item))) {
                await giveStockBack(taken);
                return false;
            }
            taken.push(item);
        }
        return true;
    } catch (err) {
        await giveStockBack(taken);
        throw err;
    }
}

export async function giveStockBack(items) {
    for (const { product, quantity } of items) {
        await Product.updateOne({ _id: product }, { $inc: { quantity } });
    }
}


export async function releaseOrder(filter) {
    const order = await Order.findOneAndDelete({
        ...filter,
        orderStatus: "unconfirmed",
    });
    if (order) await giveStockBack(order.items);
    return order;
}

// used by verify payment and webhook
export async function confirmPayment(reference, paystackData) {
    const meta = paystackData.metadata;

    if (!meta?.items) {
        throw paymentError("Payment does not belong to a checkout");
    }

    const itemKobo = Math.round(meta.totalAmount * 100);
    const isValidAmount =
        paystackData.requested_amount === itemKobo ||
        paystackData.amount >= itemKobo;

    if (!isValidAmount) {
        throw paymentError("Payment amount does not match this checkout");
    }


    const confirmed = await Order.findOneAndUpdate(
        { paystackReference: reference, orderStatus: "unconfirmed" },
        { $set: { orderStatus: "confirmed" }, $unset: { expiresAt: "" } },
        { new: true },
    );
    if (confirmed) return { order: confirmed, justPaid: true };

    const existing = await Order.findOne({ paystackReference: reference });
    if (existing) return { order: existing, justPaid: false };

    // Late payment: the order was deleted. Rebuild it from the metadata
    const available = [];
    const refundItems = [];

    try {
        for (const item of meta.items) {
            ((await takeItem(item)) ? available : refundItems).push(item);
        }
        const refundAmount = refundItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
        );

        const order = await Order.create({
            customerName: meta.customerName,
            customerEmail: meta.customerEmail,
            shippingAddress: meta.shippingAddress,
            phone: meta.phone,
            items: available,
            totalAmount: meta.totalAmount,
            paystackReference: reference,
            orderStatus: "confirmed",
            refundItems,
            refundAmount,
        });
        return { order, justPaid: true };
    } catch (err) {
        await giveStockBack(available);

        if (err.code === 11000) {
            const order = await Order.findOne({ paystackReference: reference });
            if (order) return { order, justPaid: false };
        }

        throw err;
    }
}