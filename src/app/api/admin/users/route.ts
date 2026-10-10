import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "active";

    await connectDB();

    const query: any = {};
    if (statusFilter === "active") {
      query.$or = [{ status: "active" }, { status: { $exists: false } }];
    } else if (statusFilter === "trashed") {
      query.status = "trashed";
    }

    const users = await User.find(query).select("-passwordHash").sort({ createdAt: -1 }).lean();

    // Calculate order count and total spent per user
    const usersWithStats = await Promise.all(
      users.map(async (u: any) => {
        const userOrders = await Order.find({ user: u._id }).select("totalAmount currentStatus paymentStatus").lean();
        const totalOrders = userOrders.length;
        const totalSpent = userOrders
          .filter((o) => o.paymentStatus === "paid" || o.currentStatus === "delivered")
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        return {
          ...u,
          status: u.status || "active",
          totalOrders,
          totalSpent,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error: any) {
    console.error("GET admin users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}
