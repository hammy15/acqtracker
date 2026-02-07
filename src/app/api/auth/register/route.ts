import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // Find the default org (single-org setup)
    const org = await db.organization.findFirst();
    if (!org) {
      return NextResponse.json(
        { error: "No organization found. Please contact the administrator." },
        { status: 500 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        orgId: org.id,
        email,
        passwordHash,
        name,
        role: "VIEWER",
        isActive: false, // Pending approval
      },
    });

    return NextResponse.json({
      message: "Access request submitted. An administrator will review your request.",
    });
  } catch (err) {
    console.error("[Register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
