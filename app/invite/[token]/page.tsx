import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell, SectionHeading } from "@/app/components";
import { db, schema } from "@/lib/db";
import { RedeemForm } from "./RedeemForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db.query.invites.findFirst({
    where: eq(schema.invites.token, token),
  });

  if (!invite || invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
    notFound();
  }

  return (
    <AppShell active="library">
      <div className="max-w-2xl mx-auto px-12 py-16">
        <SectionHeading title="Claim your seat" />
        <p className="text-stone-400 mb-10 leading-relaxed">
          You have been invited to join the Grand Library of Oakhaven as a{" "}
          <span className="text-primary font-bold uppercase tracking-widest">
            {invite.role === "gm" ? "Game Master" : "Scholar"}
          </span>
          . Choose the name by which the archive shall know you.
        </p>
        <RedeemForm token={token} />
      </div>
    </AppShell>
  );
}
