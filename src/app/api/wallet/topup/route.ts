import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { prismaClient } from "@/lib/prisma";

const bodySchema = z.object({
  amount: z.number().int().positive().max(100000), // in cents equivalent tokens or pricing
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Missing Stripe credentials. Please provide STRIPE_SECRET_KEY." },
      { status: 400 }
    );
  }

  // In real app, use authenticated user
  const user = await prismaClient.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "No user in database" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" as any });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsed.data.amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { userId: user.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return NextResponse.json({ error: "Stripe error" }, { status: 502 });
  }
}


