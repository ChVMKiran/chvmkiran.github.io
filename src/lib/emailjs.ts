import { profile } from "@/data/portfolio";

/**
 * Contact delivery through EmailJS.
 *
 * The site is a static export deployed to GitHub Pages, where no server-side
 * code can run. EmailJS keeps the Gmail OAuth connection on its own servers,
 * so the browser sends only the three public identifiers below — none of which
 * is an email credential. The Gmail account/password never exists in this
 * repository, and never enters the client bundle.
 *
 * The public key is designed to be shipped to browsers. It is constrained in
 * the EmailJS dashboard by an allowed-origins list (see .env.example), so a key
 * copied from this bundle only works from this site's origin.
 */

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot. Real visitors never see this field, so it must arrive empty. */
  company?: string;
};

export type SendResult = { ok: true } | { ok: false; error: string };

const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const TIMEOUT_MS = 15_000;

/** Mirrors the old server-side guard: 3 messages per 10 minutes per browser. */
const RATE_KEY = "portfolio:contact:sent";
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60_000;

/** Field caps the form was built against. */
const LIMITS = { name: 80, email: 254, subject: 120, message: 3000 } as const;

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

function configured(): boolean {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

function clean(value: string, max: number, multiline = false): string {
  // Header-bearing fields lose every control character (CR/LF included, so
  // nothing can be smuggled into a mail header). The body keeps its newlines.
  const control = multiline
    ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
    : /[\u0000-\u001f\u007f]/g;
  return value.replace(control, "").trim().slice(0, max);
}

/** Timestamps of sends still inside the rolling window. Never throws. */
function recentSends(): number[] {
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - RATE_WINDOW_MS;
    return parsed.filter(
      (entry): entry is number => typeof entry === "number" && entry > cutoff,
    );
  } catch {
    // Private mode, disabled storage, corrupt value — the guard is a courtesy,
    // not a security boundary, so failing open is correct.
    return [];
  }
}

function recordSend(sends: number[]): void {
  try {
    window.localStorage.setItem(RATE_KEY, JSON.stringify([...sends, Date.now()]));
  } catch {
    // Ignored for the same reason as above.
  }
}

export async function sendContactMessage(payload: ContactPayload): Promise<SendResult> {
  const fallback = `Please email me directly at ${profile.email}.`;

  // Honeypot: accept silently and send nothing, exactly as the server did.
  // A bot learns nothing, and a real visitor can never trip this.
  if (payload.company && payload.company.trim().length > 0) return { ok: true };

  if (!configured()) {
    console.error(
      "[contact] NEXT_PUBLIC_EMAILJS_SERVICE_ID / _TEMPLATE_ID / _PUBLIC_KEY are not configured.",
    );
    return {
      ok: false,
      error: `The contact form isn't configured yet. ${fallback}`,
    };
  }

  const sends = recentSends();
  if (sends.length >= RATE_LIMIT) {
    const retryAfter = Math.max(
      1,
      Math.ceil((sends[0] + RATE_WINDOW_MS - Date.now()) / 1000),
    );
    return {
      ok: false,
      error: `Too many messages sent. Please try again in ${retryAfter}s, or email me directly.`,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          name: clean(payload.name, LIMITS.name),
          email: clean(payload.email, LIMITS.email),
          title: clean(payload.subject, LIMITS.subject),
          message: clean(payload.message, LIMITS.message, true),
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[contact] EmailJS rejected the request (${response.status}):`, detail);

      if (response.status === 429) {
        return {
          ok: false,
          error: `Too many messages sent. ${fallback}`,
        };
      }

      return {
        ok: false,
        error: `Something went wrong sending that. ${fallback}`,
      };
    }

    recordSend(sends);
    return { ok: true };
  } catch (error) {
    console.error("[contact] EmailJS request failed:", error);
    return {
      ok: false,
      error: `Network error. ${fallback}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
