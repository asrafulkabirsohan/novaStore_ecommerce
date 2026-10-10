import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Category name is required." },
        { status: 400 }
      );
    }

    await connectDB();
    const slug = generateSlug(name);

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description?.trim(),
      icon: icon || "ShoppingBag",
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to create category." },
      { status: 500 }
    );
  }
}
