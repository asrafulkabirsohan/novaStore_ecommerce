import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const search = searchParams.get("search");
    const categorySlug = searchParams.get("category");
    const sort = searchParams.get("sort") || "createdAt_desc";

    await connectDB();

    const query: any = { status: "active" };

    // Search filter via Text Index
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Category filter by resolving slug to ObjectId
    if (categorySlug && categorySlug.trim()) {
      const categoryDoc = await Category.findOne({ slug: categorySlug.trim() });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // If category slug does not exist, return empty result
        return NextResponse.json({
          products: [],
          totalPages: 0,
          currentPage: page,
          totalCount: 0,
        });
      }
    }

    // Sorting
    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "title_asc") sortOption = { title: 1 };
    else if (sort === "createdAt_desc") sortOption = { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error: any) {
    console.error("GET products error:", error);
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
