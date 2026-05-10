import { NextRequest } from "next/server";
import dbConnect from "./mongodb";
import { GuestRateLimit } from "./models/GuestRateLimit";

const DAILY_LIMIT = 10;

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : req.headers.get("x-real-ip") || "127.0.0.1";
  return ip;
}

export async function checkGuestRateLimit(identifier: string) {
  await dbConnect();
  
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let limit = await GuestRateLimit.findOne({ identifier });

  if (!limit) {
    limit = await GuestRateLimit.create({
      identifier,
      count: 0,
      lastResetAt: now,
    });
  } else if (limit.lastResetAt < startOfDay) {
    limit.count = 0;
    limit.lastResetAt = now;
    await limit.save();
  }

  return {
    isBlocked: limit.count >= DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - limit.count),
    limit: DAILY_LIMIT,
  };
}

export async function incrementGuestRateLimit(identifier: string) {
  await dbConnect();
  await GuestRateLimit.updateOne(
    { identifier },
    { $inc: { count: 1 } }
  );
}
