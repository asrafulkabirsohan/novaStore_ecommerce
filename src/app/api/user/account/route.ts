import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Authentication required to delete account." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    await connectDB();

    // 1. Anonymize orders linked to this user (set user to null while keeping order records)
    await Order.updateMany(
      { user: userId },
      { $set: { user: null, guestEmail: session.user.email || "deleted_user" } }
    );

    // 2. Delete user account document
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "Account deleted and associated orders anonymized successfully.",
    });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { message: "Failed to delete account." },
      { status: 500 }
    );
  }
}
