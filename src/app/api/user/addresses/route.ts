import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("addresses").lean();

    return NextResponse.json(user?.addresses || []);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch address book." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { label, fullName, phone, street, city, postalCode, country, isDefault } = body;

    if (!fullName || !phone || !street || !city) {
      return NextResponse.json(
        { message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    // If setting as default, unset existing default
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label: label || "Home",
      fullName,
      phone,
      street,
      city,
      postalCode: postalCode || "1200",
      country: country || "Bangladesh",
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress as any);
    await user.save();

    return NextResponse.json(user.addresses, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to add address." },
      { status: 500 }
    );
  }
}
