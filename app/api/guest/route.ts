import { NextResponse } from "next/server";
import { generateGuestId, GUEST_COOKIE } from "@/lib/guest";

export const dynamic = "force-dynamic";

export async function POST() {
  const guestId = generateGuestId();
  const response = NextResponse.json({ guestId });
  response.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
