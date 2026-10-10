import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { generateSlug } from "@/lib/utils";

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
    const status = searchParams.get("status");

    await connectDB();

    const query: any = {};
    if (status && status !== "all") query.status = status;

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch products." },
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
    const {
      title,
      description,
      category,
      price,
      discountPrice,
      stock,
      lowStockThreshold,
      images,
      isFeatured,
      status,
    } = body;

    if (!title || !description || !category || price === undefined || stock === undefined) {
      return NextResponse.json(
        { message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    await connectDB();
    const slug = generateSlug(title);

    const product = await Product.create({
      title,
      slug,
      description,
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : 5,
      images: images || [],
      isFeatured: !!isFeatured,
      status: status || "active",
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("POST product creation error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to create product." },
      { status: 500 }
    );
  }
}
