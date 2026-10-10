"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, ShoppingCart, Zap, CheckCircle2, XCircle, ArrowLeft, Send } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IProduct, IReview } from "@/types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<IProduct | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProductData() {
      try {
        const [prodRes, revRes] = await Promise.all([
          fetch(`/api/products/${slug}`),
          fetch(`/api/products/${slug}/reviews`),
        ]);

        if (!prodRes.ok) {
          setLoading(false);
          return;
        }

        const prodData = await prodRes.ok ? await prodRes.json() : null;
        const revData = await revRes.ok ? await revRes.json() : [];

        if (prodData) {
          setProduct(prodData);
          setSelectedImage(prodData.images?.[0] || "");
        }
        setReviews(revData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProductData();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-gray-500">The product you are looking for does not exist or has been removed.</p>
        <Link
          href="/products"
          className="inline-flex items-center text-emerald-600 font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setToastMessage(`Added ${quantity} item(s) to your cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);

    if (!session) {
      setReviewError("Please sign in to write a review.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.message || "Failed to submit review");
      } else {
        setReviews([data, ...reviews]);
        setReviewComment("");
        setToastMessage("Thank you! Your review has been submitted.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      setReviewError("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm animate-in slide-in-from-bottom-4 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-emerald-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative h-80 sm:h-[450px] w-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
            <Image
              src={selectedImage || product.images[0]}
              alt={product.title}
              fill
              priority
              className="object-cover"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img
                      ? "border-emerald-600 scale-105 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 opacity-70"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Specs & CTAs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="active" className="mb-2">
              {(product.category as any)?.name || "Category"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex text-amber-400">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <span className="font-bold text-gray-900 text-sm">{product.avgRating.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({product.reviewCount} customer reviews)</span>
            </div>
          </div>

          {/* Price block */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-baseline space-x-4">
            <span className="text-3xl font-black text-emerald-600">
              {formatPrice(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock Badge */}
          <div className="flex items-center space-x-2">
            {isOutOfStock ? (
              <div className="flex items-center space-x-1.5 text-rose-600 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Out of Stock</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>In Stock ({product.stock} available)</span>
                {isLowStock && <Badge variant="low-stock">Low Stock</Badge>}
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed border-t border-b border-gray-100 py-4">
            {product.description}
          </p>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase">Quantity</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-lg border border-gray-300 font-bold text-lg hover:bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-11 h-11 rounded-lg border border-gray-300 font-bold text-lg hover:bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 min-h-[44px] text-base"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </button>

            <button
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="flex-1 inline-flex items-center justify-center px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 min-h-[44px] text-base"
            >
              <Zap className="w-5 h-5 mr-2 text-amber-400" />
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs space-y-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4">
          Customer Reviews ({reviews.length})
        </h2>

        {/* Submit Review Form */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Write a Customer Review</h3>
          {session ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {reviewError && <p className="text-xs text-rose-600 font-medium">{reviewError}</p>}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Rating:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-400 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? "fill-current" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  required
                  placeholder="Share your opinion on this product's quality, build, and delivery..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <Button type="submit" disabled={reviewSubmitting} variant="primary">
                <Send className="w-4 h-4 mr-2" />
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Please sign in to write a review.</span>
              <Link href="/login" className="font-bold text-emerald-600 hover:underline">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Review List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id?.toString()} className="border-b border-gray-100 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{rev.userName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-gray-700">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
