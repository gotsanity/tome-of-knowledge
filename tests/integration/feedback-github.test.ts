import { describe, it, expect, vi } from "vitest";
import {
  fileFeedbackIssue,
  ensureScreenshotBranch,
  buildIssueBody,
  SCREENSHOT_BRANCH,
  FEEDBACK_LABEL,
  type FeedbackOctokit,
  type FeedbackContext,
} from "@/lib/feedback/github";
import type { FeedbackPayload } from "@/lib/feedback/payload";

function makeCtx(): FeedbackContext {
  return {
    owner: "gotsanity",
    repo: "tome-of-knowledge",
    user: { username: "alice", role: "gm" },
  };
}

function makePayload(overrides: Partial<FeedbackPayload> = {}): FeedbackPayload {
  return {
    category: "bug",
    description: "Drop cap spacing looks off on Firefox when viewing /entry",
    screenshotDataUrl:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD",
    metadata: {
      pathname: "/entry",
      search: "?id=foo",
      title: "The Grand Library",
      viewportWidth: 1440,
      viewportHeight: 900,
      devicePixelRatio: 2,
      userAgent: "Mozilla/5.0",
      timestamp: "2026-04-13T12:00:00.000Z",
      recentErrors: [],
    },
    ...overrides,
  };
}

type Calls = {
  getRef: ReturnType<typeof vi.fn>;
  createBlob: ReturnType<typeof vi.fn>;
  createTree: ReturnType<typeof vi.fn>;
  createCommit: ReturnType<typeof vi.fn>;
  createRef: ReturnType<typeof vi.fn>;
  createOrUpdateFileContents: ReturnType<typeof vi.fn>;
  createIssue: ReturnType<typeof vi.fn>;
};

function makeMockOctokit(opts: { branchExists: boolean }): {
  octokit: FeedbackOctokit;
  calls: Calls;
} {
  const notFound = Object.assign(new Error("Not Found"), { status: 404 });

  const calls: Calls = {
    getRef: vi.fn(async () => {
      if (opts.branchExists) {
        return { data: { object: { sha: "existing-sha" } } };
      }
      throw notFound;
    }),
    createBlob: vi.fn(async () => ({ data: { sha: "blob-sha" } })),
    createTree: vi.fn(async () => ({ data: { sha: "tree-sha" } })),
    createCommit: vi.fn(async () => ({ data: { sha: "commit-sha" } })),
    createRef: vi.fn(async () => ({
      data: { ref: `refs/heads/${SCREENSHOT_BRANCH}` },
    })),
    createOrUpdateFileContents: vi.fn(async ({ path }) => ({
      data: { content: { path } },
    })),
    createIssue: vi.fn(async () => ({
      data: { number: 42, html_url: "https://github.com/x/y/issues/42" },
    })),
  };

  const octokit = {
    rest: {
      git: {
        getRef: calls.getRef,
        createBlob: calls.createBlob,
        createTree: calls.createTree,
        createCommit: calls.createCommit,
        createRef: calls.createRef,
      },
      repos: {
        createOrUpdateFileContents: calls.createOrUpdateFileContents,
      },
      issues: {
        create: calls.createIssue,
      },
    },
  } as unknown as FeedbackOctokit;

  return { octokit, calls };
}

describe("ensureScreenshotBranch", () => {
  it("does nothing when branch exists", async () => {
    const { octokit, calls } = makeMockOctokit({ branchExists: true });
    await ensureScreenshotBranch(octokit, "o", "r");
    expect(calls.getRef).toHaveBeenCalledTimes(1);
    expect(calls.createBlob).not.toHaveBeenCalled();
    expect(calls.createRef).not.toHaveBeenCalled();
  });

  it("creates an orphan branch when missing", async () => {
    const { octokit, calls } = makeMockOctokit({ branchExists: false });
    await ensureScreenshotBranch(octokit, "o", "r");
    expect(calls.createBlob).toHaveBeenCalledOnce();
    expect(calls.createTree).toHaveBeenCalledOnce();
    expect(calls.createCommit).toHaveBeenCalledOnce();
    // Orphan commit: no parents.
    expect(calls.createCommit.mock.calls[0][0].parents).toEqual([]);
    expect(calls.createRef).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: `refs/heads/${SCREENSHOT_BRANCH}`,
        sha: "commit-sha",
      })
    );
  });
});

describe("fileFeedbackIssue", () => {
  it("uploads screenshot, creates branch when missing, creates issue", async () => {
    const { octokit, calls } = makeMockOctokit({ branchExists: false });
    const result = await fileFeedbackIssue(
      octokit,
      makeCtx(),
      makePayload(),
      new Date("2026-04-13T12:00:00.000Z")
    );

    expect(calls.createBlob).toHaveBeenCalledOnce(); // seed branch
    expect(calls.createOrUpdateFileContents).toHaveBeenCalledOnce();

    const fileCall = calls.createOrUpdateFileContents.mock.calls[0][0];
    expect(fileCall.branch).toBe(SCREENSHOT_BRANCH);
    expect(fileCall.path).toMatch(/^screenshots\/2026-04-13\/.+\.jpg$/);
    // base64 content does not include the data URL prefix
    expect(fileCall.content).not.toContain("data:");
    expect(fileCall.content).toBe("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD");

    const issueCall = calls.createIssue.mock.calls[0][0];
    expect(issueCall.title).toMatch(/^\[Feedback\]\[Bug\] /);
    expect(issueCall.labels).toEqual([FEEDBACK_LABEL, "feedback/bug"]);
    expect(issueCall.body).toContain("raw.githubusercontent.com");
    expect(issueCall.body).toContain("gotsanity/tome-of-knowledge");
    expect(issueCall.body).toContain(SCREENSHOT_BRANCH);
    expect(issueCall.body).toContain("| Route | `/entry?id=foo` |");
    expect(issueCall.body).toContain("alice");

    expect(result.issueUrl).toBe("https://github.com/x/y/issues/42");
    expect(result.issueNumber).toBe(42);
    expect(result.screenshotUrl).toMatch(
      /raw\.githubusercontent\.com\/gotsanity\/tome-of-knowledge\/feedback-screenshots\/screenshots\/2026-04-13\//
    );
  });

  it("skips screenshot upload when payload has no screenshot", async () => {
    const { octokit, calls } = makeMockOctokit({ branchExists: true });
    const result = await fileFeedbackIssue(
      octokit,
      makeCtx(),
      makePayload({ screenshotDataUrl: null })
    );
    expect(calls.getRef).not.toHaveBeenCalled();
    expect(calls.createOrUpdateFileContents).not.toHaveBeenCalled();
    expect(calls.createIssue).toHaveBeenCalledOnce();
    expect(result.screenshotUrl).toBeNull();

    const issueCall = calls.createIssue.mock.calls[0][0];
    expect(issueCall.body).not.toContain("raw.githubusercontent.com");
  });

  it("passes category through to label and title prefix", async () => {
    const { octokit, calls } = makeMockOctokit({ branchExists: true });
    await fileFeedbackIssue(
      octokit,
      makeCtx(),
      makePayload({ category: "idea", screenshotDataUrl: null })
    );
    const issueCall = calls.createIssue.mock.calls[0][0];
    expect(issueCall.title).toMatch(/^\[Feedback\]\[Idea\] /);
    expect(issueCall.labels).toContain("feedback/idea");
  });
});

describe("buildIssueBody", () => {
  it("renders recent console errors as a code block", () => {
    const body = buildIssueBody(
      makePayload({
        metadata: {
          ...makePayload().metadata,
          recentErrors: [
            {
              message: "TypeError: x is undefined",
              stack: "at Foo (file.js:1:2)",
              at: "2026-04-13T11:59:59.000Z",
            },
          ],
        },
      }),
      makeCtx(),
      null
    );
    expect(body).toContain("### Recent console errors");
    expect(body).toContain("TypeError: x is undefined");
    expect(body).toContain("at Foo (file.js:1:2)");
  });

  it("truncates long descriptions in the title summary but keeps full body", () => {
    const long = "x".repeat(300);
    const payload = makePayload({ description: long, screenshotDataUrl: null });
    const body = buildIssueBody(payload, makeCtx(), null);
    expect(body).toContain(long);
  });
});
