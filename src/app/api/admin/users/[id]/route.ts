import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// PUT /api/admin/users/[id] - Restore / Update user status
export async function PUT(
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
    const { status } = body;

    await connectDB();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json(
        { message: "Admin accounts cannot be modified or trashed." },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { status: status || "active" } },
      { new: true }
    ).select("-passwordHash");

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status || "active"}`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("PUT admin user error:", error);
    return NextResponse.json(
      { message: "Failed to update user status." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Soft delete user to Trash or Permanent delete from DB
export async function DELETE(
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
    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";

    await connectDB();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json(
        { message: "Admin accounts cannot be deleted or moved to trash." },
        { status: 400 }
      );
    }

    if (isPermanent) {
      // Hard delete from MongoDB database
      await User.findByIdAndDelete(id);
      return NextResponse.json({
        success: true,
        message: "Customer account permanently deleted from database.",
      });
    } else {
      // Soft delete by setting status to trashed directly in DB
      const trashedUser = await User.findByIdAndUpdate(
        id,
        { $set: { status: "trashed" } },
        { new: true }
      ).select("-passwordHash");

      return NextResponse.json({
        success: true,
        message: "Customer account moved to trash successfully.",
        user: trashedUser,
      });
    }
  } catch (error: any) {
    console.error("DELETE admin user error:", error);
    return NextResponse.json(
      { message: "Failed to delete user account." },
      { status: 500 }
    );
  }
}
