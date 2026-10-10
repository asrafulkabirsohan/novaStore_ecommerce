import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    // Aggregate metrics
    const [paidOrDeliveredOrders, totalOrdersCount, pendingOrdersCount, allProducts] = await Promise.all([
      Order.find({ $or: [{ paymentStatus: "paid" }, { currentStatus: "delivered" }] }).select("totalAmount").lean(),
      Order.countDocuments({}),
      Order.countDocuments({ currentStatus: { $in: ["pending", "confirmed", "processing", "shipped"] } }),
      Product.find({ status: "active" }).select("stock lowStockThreshold").lean(),
    ]);

    const totalRevenue = paidOrDeliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lowStockCount = allProducts.filter((p) => p.stock <= (p.lowStockThreshold || 5)).length;

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      totalRevenue,
      totalOrdersCount,
      pendingOrdersCount,
      lowStockCount,
      recentOrders,
    });
  } catch (error: any) {
    console.error("GET admin metrics error:", error);
    return NextResponse.json(
      { message: "Failed to fetch metrics." },
      { status: 500 }
    );
  }
}
