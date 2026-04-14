export const FEEDBACK_CATEGORIES = ["bug", "idea", "question", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type RecentError = {
  message: string;
  stack: string | null;
  at: string;
};

export type FeedbackMetadata = {
  pathname: string;
  search: string;
  title: string;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  userAgent: string;
  timestamp: string;
  recentErrors: RecentError[];
};

export type FeedbackPayload = {
  category: FeedbackCategory;
  description: string;
  screenshotDataUrl: string | null;
  metadata: FeedbackMetadata;
};

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const MAX_DESCRIPTION = 5000;
const MAX_RECENT_ERRORS = 20;
const DATA_URL_IMAGE_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseRecentError(raw: unknown): RecentError | null {
  if (!isObject(raw)) return null;
  const message = typeof raw.message === "string" ? raw.message : null;
  const at = typeof raw.at === "string" ? raw.at : null;
  if (!message || !at) return null;
  const stack = typeof raw.stack === "string" ? raw.stack : null;
  return { message, stack, at };
}

function parseMetadata(raw: unknown): ParseResult<FeedbackMetadata> {
  if (!isObject(raw)) return { ok: false, error: "metadata must be an object" };
  const {
    pathname,
    search,
    title,
    viewportWidth,
    viewportHeight,
    devicePixelRatio,
    userAgent,
    timestamp,
    recentErrors,
  } = raw;

  if (typeof pathname !== "string")
    return { ok: false, error: "metadata.pathname must be a string" };
  if (typeof search !== "string")
    return { ok: false, error: "metadata.search must be a string" };
  if (typeof title !== "string")
    return { ok: false, error: "metadata.title must be a string" };
  if (!isFiniteNumber(viewportWidth))
    return { ok: false, error: "metadata.viewportWidth must be a number" };
  if (!isFiniteNumber(viewportHeight))
    return { ok: false, error: "metadata.viewportHeight must be a number" };
  if (!isFiniteNumber(devicePixelRatio))
    return { ok: false, error: "metadata.devicePixelRatio must be a number" };
  if (typeof userAgent !== "string")
    return { ok: false, error: "metadata.userAgent must be a string" };
  if (typeof timestamp !== "string")
    return { ok: false, error: "metadata.timestamp must be a string" };

  let errors: RecentError[] = [];
  if (recentErrors !== undefined && recentErrors !== null) {
    if (!Array.isArray(recentErrors))
      return { ok: false, error: "metadata.recentErrors must be an array" };
    errors = recentErrors
      .map(parseRecentError)
      .filter((e): e is RecentError => e !== null)
      .slice(0, MAX_RECENT_ERRORS);
  }

  return {
    ok: true,
    value: {
      pathname,
      search,
      title,
      viewportWidth,
      viewportHeight,
      devicePixelRatio,
      userAgent,
      timestamp,
      recentErrors: errors,
    },
  };
}

export function parseFeedbackPayload(raw: unknown): ParseResult<FeedbackPayload> {
  if (!isObject(raw)) return { ok: false, error: "body must be an object" };

  const categoryRaw = raw.category;
  if (
    typeof categoryRaw !== "string" ||
    !FEEDBACK_CATEGORIES.includes(categoryRaw as FeedbackCategory)
  ) {
    return {
      ok: false,
      error: `category must be one of ${FEEDBACK_CATEGORIES.join(", ")}`,
    };
  }
  const category = categoryRaw as FeedbackCategory;

  const descriptionRaw = raw.description;
  if (typeof descriptionRaw !== "string") {
    return { ok: false, error: "description is required" };
  }
  const description = descriptionRaw.trim();
  if (description.length === 0) {
    return { ok: false, error: "description must not be empty" };
  }
  if (description.length > MAX_DESCRIPTION) {
    return {
      ok: false,
      error: `description must be ${MAX_DESCRIPTION} chars or fewer`,
    };
  }

  const shotRaw = raw.screenshotDataUrl;
  let screenshotDataUrl: string | null = null;
  if (shotRaw !== null && shotRaw !== undefined) {
    if (typeof shotRaw !== "string") {
      return { ok: false, error: "screenshotDataUrl must be a string" };
    }
    if (!DATA_URL_IMAGE_RE.test(shotRaw)) {
      return {
        ok: false,
        error: "screenshotDataUrl must be a base64 image data URL",
      };
    }
    screenshotDataUrl = shotRaw;
  }

  const metaResult = parseMetadata(raw.metadata);
  if (!metaResult.ok) return metaResult;

  return {
    ok: true,
    value: {
      category,
      description,
      screenshotDataUrl,
      metadata: metaResult.value,
    },
  };
}
