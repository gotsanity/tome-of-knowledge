import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLexiconTerm } from "@/lib/vault/loaders";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const term = await getLexiconTerm(db, slug);
  if (!term) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    slug: term.slug,
    term: term.term,
    domain: term.domain,
    definition: term.definition,
  });
}
