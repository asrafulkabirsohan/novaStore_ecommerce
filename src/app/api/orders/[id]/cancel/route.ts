import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Authentication required to cancel an order." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { cancellationReason } = body;

    if (!cancellationReason?.trim()) {
      return NextResponse.json(
        { message: "Cancellation reason is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = order.user && order.user.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: "Unauthorized to cancel this order." },
        { status: 403 }
      );
    }

    // Role-based status constraints
    if (!isAdmin) {
      // Customer can only cancel if pending or confirmed
      if (!["pending", "confirmed"].includes(order.currentStatus)) {
        return NextResponse.json(
          { message: `Cannot cancel order in "${order.currentStatus}" state.` },
          { status: 400 }
        );
      }
    } else {
      if (order.currentStatus === "delivered" || order.currentStatus === "cancelled") {
        return NextResponse.json(
          { message: `Cannot cancel an order that is already ${order.currentStatus}.` },
          { status: 400 }
        );
      }
    }

    // Restore stock for cancelled order items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    // Update order status
    order.currentStatus = "cancelled";
    order.cancellationReason = cancellationReason.trim();
    order.cancelledBy = isAdmin ? "admin" : "customer";
    order.cancelledAt = new Date();

    order.trackingTimeline.push({
      status: "cancelled",
      note: `Cancelled by ${order.cancelledBy}: ${cancellationReason.trim()}`,
      updatedAt: new Date(),
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error: any) {
    console.error("Order cancellation error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to cancel order." },
      { status: 500 }
    );
  }
}
