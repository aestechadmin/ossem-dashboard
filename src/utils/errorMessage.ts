const GENERIC =
  "Something went wrong. Please try again in a moment.";

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request could not be processed. Please check your filters and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to view this data.",
  404: "The requested information could not be found.",
  408: "The request timed out. Please try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "We couldn’t load this right now. Please try again shortly.",
  502: "The server is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The server took too long to respond. Please try again.",
};

const RAW_PATTERNS = [
  /internal server error/i,
  /bad gateway/i,
  /service unavailable/i,
  /gateway timeout/i,
  /econnrefused/i,
  /network error/i,
  /failed to fetch/i,
  /request failed with status code/i,
  /^error$/i,
];

function isRawTechnicalMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length > 180) return true;
  return RAW_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** Map API / network errors to a short, professional toast message. */
export function getFriendlyErrorMessage(err: unknown, fallback = GENERIC): string {
  if (!err || typeof err !== "object") return fallback;

  const response = (err as { response?: { status?: number; data?: unknown } }).response;
  const status = response?.status;
  const data = response?.data as
    | { error?: { message?: string }; message?: string }
    | undefined;

  const apiMessage = String(data?.error?.message || data?.message || "").trim();

  if (apiMessage && !isRawTechnicalMessage(apiMessage)) {
    // Keep known product codes / clear business messages
    if (apiMessage === "SESSION_REVOKED") {
      return "You were signed out because this account was used on another device.";
    }
    // Strapi default for bad/expired JWT — never show raw text to users
    if (/invalid credentials/i.test(apiMessage)) {
      return STATUS_MESSAGES[401];
    }
    return apiMessage;
  }

  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (status && status >= 500) {
    return STATUS_MESSAGES[500];
  }

  const axiosMessage = String((err as { message?: string }).message || "").trim();
  if (axiosMessage && /network error|timeout|econnaborted/i.test(axiosMessage)) {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  // Plain string / non-HTTP error with a clear message
  if (axiosMessage && !isRawTechnicalMessage(axiosMessage)) {
    return axiosMessage;
  }

  return fallback;
}
