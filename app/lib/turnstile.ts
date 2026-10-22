/*
 * Cloudflare Turnstile, the check that keeps bots from
 * filling the feedback form.
 *
 * The sitekey is public. The secret key is not, and it lives
 * only in the Cloudflare settings as TURNSTILE_SECRET_KEY.
 */
export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Cloudflare's published test sitekey. It always passes and
// works on any domain, so it protects nothing.
const ALWAYS_PASS_TEST_SITEKEY = "1x00000000000000000000AA";

/*
 * REPLACE THIS with the real sitekey from the Turnstile widget
 * in the Cloudflare dashboard before the form goes live.
 *
 * While it is still the test key:
 * - a build on Cloudflare Pages fails (see below), and
 * - the form refuses to send from any host other than
 *   localhost, so the test key cannot ship quietly.
 */
const PRODUCTION_SITEKEY: string = ALWAYS_PASS_TEST_SITEKEY;

export const TURNSTILE_SITEKEY =
  process.env.NODE_ENV === "development"
    ? ALWAYS_PASS_TEST_SITEKEY
    : PRODUCTION_SITEKEY;

/*
 * Cloudflare Pages sets CF_PAGES=1 while it builds. Stopping
 * the build there means the test key never reaches the live
 * site. A local or GitHub Actions build is not stopped, so
 * lint and build keep passing on this branch.
 */
if (
  process.env.NODE_ENV === "production" &&
  process.env.CF_PAGES === "1" &&
  TURNSTILE_SITEKEY === ALWAYS_PASS_TEST_SITEKEY
) {
  throw new Error(
    "app/lib/turnstile.ts still has the Turnstile test sitekey. Put the real sitekey in PRODUCTION_SITEKEY.",
  );
}

function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

/*
 * Returns why the check cannot be used here, or null. A page
 * served from a real host with the test sitekey is refused,
 * even if it was built somewhere other than Cloudflare Pages.
 */
export function turnstileSetupProblem(): string | null {
  if (
    TURNSTILE_SITEKEY === ALWAYS_PASS_TEST_SITEKEY &&
    !isLocalHost(window.location.hostname)
  ) {
    return "The Turnstile test sitekey is in use on a real host. Replace it in app/lib/turnstile.ts.";
  }

  return null;
}

type TurnstileOptions = {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "refresh-expired"?: "auto" | "manual" | "never";
  "response-field"?: boolean;
};

export type TurnstileApi = {
  render: (
    container: string,
    options: TurnstileOptions,
  ) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

/*
 * Adds the Turnstile script to the page the first time it is
 * asked for, from Cloudflare's own address and nowhere else.
 * Explicit rendering means nothing is drawn until render is
 * called. A failed load can be tried again.
 */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (!loading) {
    loading = new Promise<TurnstileApi>(
      (resolve, reject) => {
        const script = document.createElement("script");

        script.src = `${TURNSTILE_SCRIPT_URL}?render=explicit`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.turnstile) {
            resolve(window.turnstile);
          } else {
            loading = null;
            script.remove();
            reject(new Error("Turnstile did not start"));
          }
        };

        script.onerror = () => {
          loading = null;
          script.remove();
          reject(new Error("Turnstile did not load"));
        };

        document.head.appendChild(script);
      },
    );
  }

  return loading;
}
