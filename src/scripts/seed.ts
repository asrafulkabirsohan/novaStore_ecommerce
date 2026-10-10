import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { connectDB } from "../lib/db";
import User from "../models/User";
import Category from "../models/Category";
import Product from "../models/Product";
import Review from "../models/Review";
import Order from "../models/Order";

async function seed() {
  console.log("🌱 Starting Database Seeding...");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is missing.");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("✅ Connected to MongoDB.");

    // Clean existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    console.log("🧹 Cleared existing database collections.");

    // 1. Seed Users
    const adminPasswordHash = await bcryptjs.hash("admin123", 12);
    const userPasswordHash = await bcryptjs.hash("user123", 12);

    const admin = await User.create({
      name: "Admin User",
      email: "admin@store.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      phone: "+8801700000000",
      addresses: [
        {
          label: "Headquarters",
          fullName: "Admin User",
          phone: "+8801700000000",
          street: "123 Commerce Way",
          city: "Dhaka",
          postalCode: "1212",
          country: "Bangladesh",
          isDefault: true,
        },
      ],
    });

    const customer = await User.create({
      name: "Test User",
      email: "user@store.com",
      passwordHash: userPasswordHash,
      role: "user",
      phone: "+8801800000000",
      addresses: [
        {
          label: "Home",
          fullName: "Test User",
          phone: "+8801800000000",
          street: "45 Green Road",
          city: "Dhaka",
          postalCode: "1205",
          country: "Bangladesh",
          isDefault: true,
        },
      ],
    });

    console.log("✅ Created 2 Users (Admin & Customer).");

    // 2. Seed Categories
    const categoriesData = [
      {
        name: "Electronics",
        slug: "electronics",
        description: "Latest gadgets, smart devices, and accessories.",
        icon: "Cpu",
      },
      {
        name: "Clothing",
        slug: "clothing",
        description: "Trendy apparel, footwear, and fashion wear.",
        icon: "Shirt",
      },
      {
        name: "Home & Kitchen",
        slug: "home-kitchen",
        description: "Modern home appliances, kitchenware, and decor.",
        icon: "Home",
      },
      {
        name: "Books",
        slug: "books",
        description: "Bestselling novels, educational books, and literature.",
        icon: "BookOpen",
      },
    ];

    const insertedCategories = await Category.insertMany(categoriesData);
    console.log(`✅ Created ${insertedCategories.length} Categories.`);

    const catMap = new Map(
      insertedCategories.map((c) => [c.slug, c._id.toString()])
    );

    // 3. Seed Products
    const productsData = [
      // Electronics
      {
        title: "Wireless Noise-Canceling Headphones",
        slug: "wireless-noise-canceling-headphones",
        description:
          "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio quality.",
        category: catMap.get("electronics"),
        price: 8500,
        discountPrice: 7900,
        stock: 15,
        lowStockThreshold: 5,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.8,
        reviewCount: 12,
        isFeatured: true,
        status: "active",
      },
      {
        title: "Smart Fitness Watch Ultra",
        slug: "smart-fitness-watch-ultra",
        description:
          "Advanced smartwatch featuring heart rate tracking, GPS navigation, sleep monitoring, and water resistance up to 50m.",
        category: catMap.get("electronics"),
        price: 12500,
        discountPrice: 11000,
        stock: 2, // Low stock test product!
        lowStockThreshold: 5,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.6,
        reviewCount: 8,
        isFeatured: true,
        status: "active",
      },
      // Clothing
      {
        title: "Classic Cotton Casual Shirt",
        slug: "classic-cotton-casual-shirt",
        description:
          "Breathable 100% premium cotton slim-fit shirt perfect for casual outings and smart work attire.",
        category: catMap.get("clothing"),
        price: 1850,
        discountPrice: 1500,
        stock: 35,
        lowStockThreshold: 5,
        images: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.5,
        reviewCount: 20,
        isFeatured: true,
        status: "active",
      },
      {
        title: "Urban Denim Jacket",
        slug: "urban-denim-jacket",
        description:
          "Stylish rugged denim jacket with soft lining, double chest pockets, and durable stitching.",
        category: catMap.get("clothing"),
        price: 3200,
        stock: 8,
        lowStockThreshold: 5,
        images: [
          "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.7,
        reviewCount: 5,
        isFeatured: false,
        status: "active",
      },
      // Home & Kitchen
      {
        title: "Automatic Drip Coffee Maker",
        slug: "automatic-drip-coffee-maker",
        description:
          "Programmable 12-cup coffee maker with thermal glass carafe, auto shut-off, and brew strength control.",
        category: catMap.get("home-kitchen"),
        price: 4500,
        discountPrice: 3990,
        stock: 12,
        lowStockThreshold: 3,
        images: [
          "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.9,
        reviewCount: 15,
        isFeatured: true,
        status: "active",
      },
      {
        title: "Ergonomic Desk LED Lamp",
        slug: "ergonomic-desk-led-lamp",
        description:
          "Dimmable LED desk lamp with 5 color modes, touch controls, and integrated USB charging port.",
        category: catMap.get("home-kitchen"),
        price: 2100,
        stock: 25,
        lowStockThreshold: 5,
        images: [
          "https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.4,
        reviewCount: 6,
        isFeatured: false,
        status: "active",
      },
      // Books
      {
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        slug: "clean-code-handbook",
        description:
          "A classic handbook for software developers to write readable, maintainable, and efficient code.",
        category: catMap.get("books"),
        price: 1200,
        stock: 40,
        lowStockThreshold: 5,
        images: [
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 5.0,
        reviewCount: 42,
        isFeatured: true,
        status: "active",
      },
      {
        title: "Designing Data-Intensive Applications",
        slug: "designing-data-intensive-applications",
        description:
          "Comprehensive guide to distributed systems, data storage, scalability, and system architecture.",
        category: catMap.get("books"),
        price: 1650,
        discountPrice: 1450,
        stock: 18,
        lowStockThreshold: 4,
        images: [
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
        ],
        avgRating: 4.9,
        reviewCount: 30,
        isFeatured: false,
        status: "active",
      },
    ];

    const insertedProducts = await Product.insertMany(productsData);
    console.log(`✅ Created ${insertedProducts.length} Products.`);

    // 4. Seed sample reviews
    await Review.create({
      product: insertedProducts[0]._id,
      user: customer._id,
      userName: customer.name,
      rating: 5,
      comment: "Outstanding sound quality and super comfortable noise cancellation!",
    });
    console.log("✅ Created Sample Review.");

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
