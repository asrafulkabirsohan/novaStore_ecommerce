import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Review from "@/models/Review";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const reviews = await Review.find({ product: product._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("GET product reviews error:", error);
    return NextResponse.json(
      { message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Authentication required to write a review" },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await req.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5 || !comment?.trim()) {
      return NextResponse.json(
        { message: "Please provide a valid rating (1-5) and comment." },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Check duplicate review
    const existingReview = await Review.findOne({
      product: product._id,
      user: session.user.id,
    });

    if (existingReview) {
      return NextResponse.json(
        { message: "You have already reviewed this product." },
        { status: 409 }
      );
    }

    // Create review
    const newReview = await Review.create({
      product: product._id,
      user: session.user.id,
      userName: session.user.name || "Verified Buyer",
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Recalculate Product avgRating and reviewCount
    const allReviews = await Review.find({ product: product._id });
    const reviewCount = allReviews.length;
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

    product.reviewCount = reviewCount;
    product.avgRating = parseFloat(avgRating.toFixed(1));
    await product.save();

    return NextResponse.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error("POST product review error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
