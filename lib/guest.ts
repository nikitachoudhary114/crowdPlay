import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export const GUEST_COOKIE = "crowdplay_guest_id";
export const GUEST_NAME_COOKIE = "crowdplay_guest_name";

export async function getGuestId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

export async function ensureGuestId(): Promise<string> {
  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId) {
    guestId = `guest_${nanoid(12)}`;
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return guestId;
}

export function generateGuestId(): string {
  return `guest_${nanoid(12)}`;
}
