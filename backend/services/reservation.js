import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

// Take ONE item. Checks and deducts in the same step.
async function takeItem({ product, quantity }) {
    const res = await Product.updateOne(
        { _id: product, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
    );
    return res.modifiedCount === 1;
}

// Used at checkout: all items or nothing.
export async function takeStock(items) {
    const taken = [];
    for (const item of items) {
        if (!(await takeItem(item))) {
            await giveStockBack(taken);
            return false;
        }
        taken.push(item);
    }
    return true;
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


// Used by BOTH verifyPayment and the webhook
export async function confirmPayment(reference, paystackData) {
    const meta = paystackData.metadata;
    const paidKobo = paystackData.requested_amount || paystackData.amount;

    if (paidKobo !== Math.round(meta.totalAmount * 100)) {
        return { reason: "Payment details do not match this checkout" };
    }

    // 1. Normal case: paid within 15 minutes, the order still exists
    const confirmed = await Order.findOneAndUpdate(
        { paystackReference: reference, orderStatus: "unconfirmed" },
        { orderStatus: "confirmed" },
        { new: true },
    );
    if (confirmed) return { order: confirmed, justPaid: true };

    // 2. The other path (webhook or verify) already confirmed it
    const existing = await Order.findOne({ paystackReference: reference });
    if (existing) return { order: existing, justPaid: false };

    // 3. Late payment: the order was deleted. Rebuild it from the metadata
    //    and check each item separately.
    const available = [];
    const refundItems = [];
    for (const item of meta.items) {
        ((await takeItem(item)) ? available : refundItems).push(item);
    }
    const refundAmount = refundItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    try {
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
        if (err.code === 11000) {
            // The other path rebuilt it first, so return the stock we just took
            await giveStockBack(available);
            return { order: await Order.findOne({ paystackReference: reference }), justPaid: false };
        }
        throw err;
    }
}