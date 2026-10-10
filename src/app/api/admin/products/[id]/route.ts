import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { generateSlug } from "@/lib/utils";

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

    await connectDB();

    if (body.title) {
      body.slug = generateSlug(body.title);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to update product." },
      { status: 500 }
    );
  }
}

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
    await connectDB();

    // Soft delete by marking as archived
    const product = await Product.findByIdAndUpdate(
      id,
      { status: "archived" },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Product archived successfully.",
      product,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to archive product." },
      { status: 500 }
    );
  }
}
