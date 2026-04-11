import crypto from "crypto";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SubscriptionPlan } from "@/lib/models/SubscriptionPlan";

function verifySignature(payload: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.type !== "subscription.updated" && event.type !== "subscription.created") {
      return NextResponse.json({ received: true });
    }

    const data = event.data?.object || {};
    const metadata = data.metadata || {};
    const userId = metadata.userId;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId metadata" }, { status: 400 });
    }

    await dbConnect();

    const tier =
      data.items?.data?.[0]?.price?.lookup_key === "growth_40"
        ? "growth_40"
        : data.items?.data?.[0]?.price?.lookup_key === "enterprise"
          ? "enterprise"
          : "pro_20";

    const monthlyCredits =
      tier === "growth_40" ? 250 : tier === "enterprise" ? 1000 : 100;

    await SubscriptionPlan.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          tier,
          monthlyCredits,
          status: data.status === "active" ? "active" : "past_due",
          stripeCustomerId: data.customer || "",
          stripeSubscriptionId: data.id || "",
          currentPeriodStart: data.current_period_start
            ? new Date(data.current_period_start * 1000)
            : null,
          currentPeriodEnd: data.current_period_end
            ? new Date(data.current_period_end * 1000)
            : null,
          metadata,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Billing webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
