import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";

type RedeemBody = {
  username?: unknown;
  email?: unknown;
  displayName?: unknown;
  password?: unknown;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await db.query.invites.findFirst({
    where: eq(schema.invites.token, token),
  });

  if (!invite) {
    return NextResponse.json({ error: "invite not found" }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "invite already used" }, { status: 410 });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "invite expired" }, { status: 410 });
  }

  const body = (await req.json().catch(() => ({}))) as RedeemBody;
  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !email || !displayName || password.length < 8) {
    return NextResponse.json(
      {
        error:
          "username, email, displayName required; password must be 8+ chars",
      },
      { status: 400 }
    );
  }

  const existingUsername = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });
  if (existingUsername) {
    return NextResponse.json(
      { error: "username already taken" },
      { status: 409 }
    );
  }
  const existingEmail = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  if (existingEmail) {
    return NextResponse.json(
      { error: "email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(schema.users).values({
    username,
    email,
    displayName,
    name: displayName,
    passwordHash,
    role: invite.role,
  });

  await db
    .update(schema.invites)
    .set({ usedAt: new Date() })
    .where(eq(schema.invites.id, invite.id));

  return NextResponse.json({ ok: true, username });
}
