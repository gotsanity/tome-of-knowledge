import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { getSessionUser } from "@/lib/auth-helpers";
import { parseFeedbackPayload } from "@/lib/feedback/payload";
import { fileFeedbackIssue, type FeedbackOctokit } from "@/lib/feedback/github";

function parseRepo(raw: string | undefined): { owner: string; repo: string } | null {
  if (!raw) return null;
  const match = /^([^/\s]+)\/([^/\s]+)$/.exec(raw.trim());
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  const repoEnv = parseRepo(process.env.GITHUB_REPO);
  if (!token || !repoEnv) {
    return NextResponse.json(
      { error: "feedback is not configured on this server" },
      { status: 503 }
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = parseFeedbackPayload(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const octokit = new Octokit({ auth: token }) as unknown as FeedbackOctokit;

  try {
    const result = await fileFeedbackIssue(octokit, {
      owner: repoEnv.owner,
      repo: repoEnv.repo,
      user: {
        username: user.username ?? user.name ?? "unknown",
        role: user.role ?? "user",
      },
    }, parsed.value);
    return NextResponse.json({
      ok: true,
      issueUrl: result.issueUrl,
      issueNumber: result.issueNumber,
    });
  } catch (err) {
    console.error("[feedback] failed to file issue", err);
    return NextResponse.json(
      { error: "failed to file feedback issue" },
      { status: 502 }
    );
  }
}
