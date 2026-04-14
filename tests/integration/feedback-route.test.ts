import { describe, it, expect, beforeEach, vi } from "vitest";

const getSessionUserMock = vi.fn();
const octokitIssuesCreate = vi.fn();
const octokitCreateOrUpdateFileContents = vi.fn();
const octokitGetRef = vi.fn();
const octokitCreateBlob = vi.fn();
const octokitCreateTree = vi.fn();
const octokitCreateCommit = vi.fn();
const octokitCreateRef = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  getSessionUser: () => getSessionUserMock(),
}));

vi.mock("@octokit/rest", () => ({
  Octokit: class {
    rest = {
      git: {
        getRef: octokitGetRef,
        createBlob: octokitCreateBlob,
        createTree: octokitCreateTree,
        createCommit: octokitCreateCommit,
        createRef: octokitCreateRef,
      },
      repos: { createOrUpdateFileContents: octokitCreateOrUpdateFileContents },
      issues: { create: octokitIssuesCreate },
    };
  },
}));

// Import after mocks are registered.
import { POST } from "@/app/api/feedback/route";

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    category: "bug",
    description: "Test description",
    screenshotDataUrl: null,
    metadata: {
      pathname: "/",
      search: "",
      title: "Home",
      viewportWidth: 1280,
      viewportHeight: 720,
      devicePixelRatio: 1,
      userAgent: "ua",
      timestamp: "2026-04-13T12:00:00.000Z",
      recentErrors: [],
    },
  };
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "gha-token";
    process.env.GITHUB_REPO = "gotsanity/tome-of-knowledge";
    octokitGetRef.mockResolvedValue({ data: { object: { sha: "sha" } } });
    octokitIssuesCreate.mockResolvedValue({
      data: { number: 7, html_url: "https://github.com/x/y/issues/7" },
    });
  });

  it("returns 401 when not logged in", async () => {
    getSessionUserMock.mockResolvedValue(null);
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(401);
    expect(octokitIssuesCreate).not.toHaveBeenCalled();
  });

  it("returns 503 when GITHUB_TOKEN is missing", async () => {
    getSessionUserMock.mockResolvedValue({ username: "alice", role: "gm" });
    delete process.env.GITHUB_TOKEN;
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(503);
  });

  it("returns 503 when GITHUB_REPO is malformed", async () => {
    getSessionUserMock.mockResolvedValue({ username: "alice", role: "gm" });
    process.env.GITHUB_REPO = "not-a-repo";
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(503);
  });

  it("returns 400 on invalid payload", async () => {
    getSessionUserMock.mockResolvedValue({ username: "alice", role: "gm" });
    const res = await POST(jsonReq({ category: "nope" }));
    expect(res.status).toBe(400);
  });

  it("creates an issue on happy path", async () => {
    getSessionUserMock.mockResolvedValue({ username: "alice", role: "gm" });
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.issueUrl).toBe("https://github.com/x/y/issues/7");
    expect(json.issueNumber).toBe(7);
    expect(octokitIssuesCreate).toHaveBeenCalledOnce();
    const call = octokitIssuesCreate.mock.calls[0][0];
    expect(call.owner).toBe("gotsanity");
    expect(call.repo).toBe("tome-of-knowledge");
    expect(call.labels).toContain("user-feedback");
  });

  it("returns 502 when GitHub call fails", async () => {
    getSessionUserMock.mockResolvedValue({ username: "alice", role: "gm" });
    octokitIssuesCreate.mockRejectedValue(new Error("boom"));
    const res = await POST(jsonReq(validBody()));
    expect(res.status).toBe(502);
  });
});
