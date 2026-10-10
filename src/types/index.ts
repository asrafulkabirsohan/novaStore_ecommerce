import { Types } from "mongoose";

// --- Address Interface ---
export interface IAddress {
  _id?: Types.ObjectId | string;
  label: string; // e.g. "Home", "Office"
  fullName: string; // recipient name
  phone: string; // contact number
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// --- User Interface ---
export interface IUser {
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  passwordHash?: string;
  role: "user" | "admin";
  status?: "active" | "trashed";
  phone?: string;
  addresses: IAddress[];
  createdAt?: Date;
  updatedAt?: Date;
}

// --- Category Interface ---
export interface ICategory {
  _id?: Types.ObjectId | string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// --- Product Interface ---
export interface IProduct {
  _id?: Types.ObjectId | string;
  title: string;
  slug: string;
  description: string;
  category: Types.ObjectId | string | ICategory;
  price: number;
  discountPrice?: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  status: "active" | "draft" | "archived";
  createdAt?: Date;
  updatedAt?: Date;
}

// --- Review Interface ---
export interface IReview {
  _id?: Types.ObjectId | string;
  product: Types.ObjectId | string;
  user: Types.ObjectId | string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// --- Order Interfaces ---
export interface IOrderItem {
  product: Types.ObjectId | string;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ITrackingEvent {
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  note?: string;
  updatedAt: Date;
}

export interface IOrder {
  _id?: Types.ObjectId | string;
  orderNumber: string;
  user?: Types.ObjectId | string | null; // null for guest checkout
  guestEmail?: string;
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: "COD" | "bKash" | "Nagad" | "SSLCommerz" | "Stripe";
  paymentStatus: "pending" | "paid" | "failed";
  paymentGatewayRef?: string;
  paymentWebhookVerified: boolean;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  currentStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  cancellationReason?: string;
  cancelledBy?: "customer" | "admin";
  cancelledAt?: Date;
  trackingTimeline: ITrackingEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}
