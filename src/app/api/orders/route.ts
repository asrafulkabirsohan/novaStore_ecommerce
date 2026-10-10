import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();

    const { items, shippingAddress, paymentMethod, guestEmail } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Order items cannot be empty." },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street) {
      return NextResponse.json(
        { message: "Incomplete shipping address." },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Verify stock and calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const pId = item.productId || item.product?._id;
      const qty = Number(item.quantity);

      // Atomic stock guard using findOneAndUpdate with stock requirement condition
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: pId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!updatedProduct) {
        return NextResponse.json(
          { message: `Product "${item.title || "Item"}" is out of stock or insufficient quantity.` },
          { status: 400 }
        );
      }

      const price = updatedProduct.discountPrice || updatedProduct.price;
      subtotal += price * qty;

      orderItems.push({
        product: updatedProduct._id,
        title: updatedProduct.title,
        image: updatedProduct.images[0] || "",
        price,
        quantity: qty,
      });
    }

    const shippingFee = subtotal > 3000 ? 0 : 100;
    const totalAmount = subtotal + shippingFee;

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: session?.user?.id || null,
      guestEmail: session?.user?.email || guestEmail || null,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "Bangladesh",
      },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
      subtotal,
      shippingFee,
      totalAmount,
      currentStatus: "pending",
      trackingTimeline: [
        {
          status: "pending",
          note: "Order placed successfully",
          updatedAt: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST order creation error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to create order." },
      { status: 500 }
    );
  }
}
