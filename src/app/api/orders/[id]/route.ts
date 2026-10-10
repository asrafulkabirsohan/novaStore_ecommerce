import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id).populate("user", "name email phone role").lean();
    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    const session = await auth();

    // Access check: must be owner, guest email match, or admin
    const isAdmin = session?.user?.role === "admin";
    const isOwner = session?.user?.id && order.user && order.user.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: "Access denied. You can only view your own orders." },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("GET order by ID error:", error);
    return NextResponse.json(
      { message: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}
