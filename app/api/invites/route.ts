import { NextResponse } from "next/server";
import { requireGm } from "@/lib/auth-helpers";
import { db, schema } from "@/lib/db";
import { isRole } from "@/lib/auth-helpers";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const gm = await requireGm();
  if (!gm) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — defaults to role "user"
  }

  const requestedRole =
    body && typeof body === "object" && "role" in body
      ? (body as { role: unknown }).role
      : "user";

  if (!isRole(requestedRole)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

  await db.insert(schema.invites).values({
    token,
    role: requestedRole,
    createdBy: gm.id,
    expiresAt,
  });

  return NextResponse.json({
    token,
    url: `/invite/${token}`,
    role: requestedRole,
    expiresAt: expiresAt.toISOString(),
  });
}
