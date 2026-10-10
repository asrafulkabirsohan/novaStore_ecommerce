import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendOrderShippedEmail } from "@/lib/email";

const VALID_STAGES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    if (!VALID_STAGES.includes(status)) {
      return NextResponse.json(
        { message: "Invalid target order status." },
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

    const currentIndex = VALID_STAGES.indexOf(order.currentStatus);
    const newIndex = VALID_STAGES.indexOf(status);

    // Prevent going backwards (unless cancelling)
    if (status !== "cancelled" && newIndex < currentIndex) {
      return NextResponse.json(
        { message: `Cannot revert order status from "${order.currentStatus}" backward to "${status}".` },
        { status: 400 }
      );
    }

    order.currentStatus = status;

    // Trigger auto-pay on delivered
    if (status === "delivered") {
      order.paymentStatus = "paid";
    }

    order.trackingTimeline.push({
      status,
      note: note || `Status updated to ${status} by Admin`,
      updatedAt: new Date(),
    });

    await order.save();

    // Trigger async email if status is shipped
    if (status === "shipped") {
      let recipientEmail = order.guestEmail;
      if (!recipientEmail && order.user) {
        const u = await User.findById(order.user).select("email").lean();
        if (u) recipientEmail = u.email;
      }
      if (recipientEmail) {
        sendOrderShippedEmail(order as any, recipientEmail, note).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to update order status." },
      { status: 500 }
    );
  }
}
