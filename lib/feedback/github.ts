import type { FeedbackPayload } from "./payload";

export const SCREENSHOT_BRANCH = "feedback-screenshots";
export const FEEDBACK_LABEL = "user-feedback";

export type FeedbackContext = {
  owner: string;
  repo: string;
  user: { username: string; role: string };
};

export type FileFeedbackResult = {
  issueUrl: string;
  issueNumber: number;
  screenshotUrl: string | null;
};

/**
 * Minimal structural interface of @octokit/rest that we consume. Keeps tests
 * free from needing to mock the full Octokit surface — pass a fake that
 * implements these methods.
 */
export type FeedbackOctokit = {
  rest: {
    git: {
      getRef(params: {
        owner: string;
        repo: string;
        ref: string;
      }): Promise<{ data: { object: { sha: string } } }>;
      createBlob(params: {
        owner: string;
        repo: string;
        content: string;
        encoding: "base64" | "utf-8";
      }): Promise<{ data: { sha: string } }>;
      createTree(params: {
        owner: string;
        repo: string;
        tree: Array<{
          path: string;
          mode: "100644";
          type: "blob";
          sha: string;
        }>;
      }): Promise<{ data: { sha: string } }>;
      createCommit(params: {
        owner: string;
        repo: string;
        message: string;
        tree: string;
        parents: string[];
      }): Promise<{ data: { sha: string } }>;
      createRef(params: {
        owner: string;
        repo: string;
        ref: string;
        sha: string;
      }): Promise<{ data: { ref: string } }>;
    };
    repos: {
      createOrUpdateFileContents(params: {
        owner: string;
        repo: string;
        path: string;
        message: string;
        content: string;
        branch: string;
        sha?: string;
      }): Promise<{ data: { content: { path: string } | null } }>;
    };
    issues: {
      create(params: {
        owner: string;
        repo: string;
        title: string;
        body: string;
        labels: string[];
      }): Promise<{ data: { number: number; html_url: string } }>;
    };
  };
};

function summarize(description: string, max = 60): string {
  const oneLine = description.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function randomId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 14);
}

function extractBase64(dataUrl: string): { content: string; ext: string } {
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("invalid screenshot data URL");
  }
  const mime = match[1];
  const ext = mime === "jpeg" ? "jpg" : mime;
  return { content: match[2], ext };
}

async function branchExists(
  octokit: FeedbackOctokit,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${SCREENSHOT_BRANCH}`,
    });
    return true;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 404
    ) {
      return false;
    }
    throw err;
  }
}

/**
 * Creates the screenshot branch as an orphan (no parents) if it doesn't exist.
 * Idempotent — returns without work if the branch is already present.
 */
export async function ensureScreenshotBranch(
  octokit: FeedbackOctokit,
  owner: string,
  repo: string
): Promise<void> {
  if (await branchExists(octokit, owner, repo)) return;

  const seed = await octokit.rest.git.createBlob({
    owner,
    repo,
    content:
      "# Feedback Screenshots\n\nThis orphan branch stores screenshots attached to feedback issues filed via the in-app reporter. Do not merge it into main.\n",
    encoding: "utf-8",
  });

  const tree = await octokit.rest.git.createTree({
    owner,
    repo,
    tree: [
      {
        path: "README.md",
        mode: "100644",
        type: "blob",
        sha: seed.data.sha,
      },
    ],
  });

  const commit = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: "chore(feedback): seed screenshot branch",
    tree: tree.data.sha,
    parents: [],
  });

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${SCREENSHOT_BRANCH}`,
    sha: commit.data.sha,
  });
}

async function uploadScreenshot(
  octokit: FeedbackOctokit,
  ctx: FeedbackContext,
  dataUrl: string,
  now: Date
): Promise<string> {
  await ensureScreenshotBranch(octokit, ctx.owner, ctx.repo);
  const { content, ext } = extractBase64(dataUrl);
  const path = `screenshots/${formatYmd(now)}/${randomId()}.${ext}`;

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: ctx.owner,
    repo: ctx.repo,
    path,
    message: `feedback: upload screenshot ${path}`,
    content,
    branch: SCREENSHOT_BRANCH,
  });

  return `https://raw.githubusercontent.com/${ctx.owner}/${ctx.repo}/${SCREENSHOT_BRANCH}/${path}`;
}

export function buildIssueBody(
  payload: FeedbackPayload,
  ctx: FeedbackContext,
  screenshotUrl: string | null
): string {
  const m = payload.metadata;
  const route = m.pathname + (m.search ?? "");
  const lines: string[] = [];
  lines.push(`## Feedback — ${capitalize(payload.category)}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Reported by | \`${ctx.user.username}\` (${ctx.user.role}) |`);
  lines.push(`| Route | \`${route}\` |`);
  lines.push(`| Page title | ${m.title || "(empty)"} |`);
  lines.push(
    `| Viewport | ${m.viewportWidth}×${m.viewportHeight} @${m.devicePixelRatio}x |`
  );
  lines.push(`| User agent | \`${m.userAgent}\` |`);
  lines.push(`| Timestamp | ${m.timestamp} |`);
  lines.push("");
  if (screenshotUrl) {
    lines.push(`![screenshot](${screenshotUrl})`);
    lines.push("");
  }
  lines.push("### Description");
  lines.push("");
  lines.push(payload.description);
  if (m.recentErrors.length > 0) {
    lines.push("");
    lines.push("### Recent console errors");
    lines.push("");
    lines.push("```");
    for (const err of m.recentErrors) {
      lines.push(`[${err.at}] ${err.message}`);
      if (err.stack) lines.push(err.stack);
    }
    lines.push("```");
  }
  lines.push("");
  lines.push("---");
  lines.push("_Filed via the in-app feedback reporter._");
  return lines.join("\n");
}

export async function fileFeedbackIssue(
  octokit: FeedbackOctokit,
  ctx: FeedbackContext,
  payload: FeedbackPayload,
  now: Date = new Date()
): Promise<FileFeedbackResult> {
  let screenshotUrl: string | null = null;
  if (payload.screenshotDataUrl) {
    screenshotUrl = await uploadScreenshot(
      octokit,
      ctx,
      payload.screenshotDataUrl,
      now
    );
  }

  const title = `[Feedback][${capitalize(payload.category)}] ${summarize(payload.description)}`;
  const body = buildIssueBody(payload, ctx, screenshotUrl);
  const labels = [FEEDBACK_LABEL, `feedback/${payload.category}`];

  const issue = await octokit.rest.issues.create({
    owner: ctx.owner,
    repo: ctx.repo,
    title,
    body,
    labels,
  });

  return {
    issueUrl: issue.data.html_url,
    issueNumber: issue.data.number,
    screenshotUrl,
  };
}
