/*
 * Receives a feedback report from the dialog in Settings and
 * stores it in the D1 database bound as DB. Runs as a Pages
 * Function, so it is not part of the Next build.
 *
 * Nothing the person typed is ever put in a response or a log.
 * No IP address, user agent or header is stored.
 */

// Keep these limits the same as FEEDBACK_LIMITS in
// app/lib/feedback-client.ts.
const LIMITS = {
  happened: 2000,
  did: 1000,
  expected: 1000,
  device: 200,
  email: 254,
  version: 20,
};

const MAX_BODY_BYTES = 10 * 1024;
const MAX_TOKEN_LENGTH = 2048;
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 5000;
const DAILY_CAP = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Control characters except the newline (\n).
const CONTROL_CHARACTERS = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;

function reply(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function fail(status, error, headers) {
  return reply(status, { ok: false, error }, headers);
}

/*
 * The page and this Function share one origin, so the Origin
 * header has to name the same host the request was sent to.
 * That also lets preview deployments work.
 */
function isSameOrigin(request) {
  const origin = request.headers.get("Origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/*
 * Reads the body but stops as soon as it passes the limit,
 * whatever Content-Length says. Returns null when too large.
 */
async function readBody(request) {
  const declared = Number(request.headers.get("Content-Length"));

  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return null;
  }

  if (!request.body) {
    return new Uint8Array(0);
  }

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > MAX_BODY_BYTES) {
      await reader.cancel();

      return null;
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

function clean(value) {
  return value.replace(CONTROL_CHARACTERS, "").trim();
}

/*
 * Returns the cleaned report and token, or an error message. Only
 * these fields are read. Anything else in the body is dropped.
 */
function validate(body) {
  const fields = {
    happened: body.happened,
    did: body.did ?? "",
    expected: body.expected ?? "",
    device: body.device ?? "",
    email: body.email ?? "",
    version: body.version,
  };

  for (const value of Object.values(fields)) {
    if (typeof value !== "string") {
      return { error: "Invalid report." };
    }
  }

  const report = {};

  for (const [key, value] of Object.entries(fields)) {
    report[key] = clean(value);

    if (report[key].length > LIMITS[key]) {
      return { error: "A field is too long." };
    }
  }

  if (!report.happened) {
    return { error: "What happened is required." };
  }

  if (!report.version) {
    return { error: "Invalid report." };
  }

  if (report.email && !EMAIL_PATTERN.test(report.email)) {
    return { error: "That email doesn't look right." };
  }

  if (
    typeof body.token !== "string" ||
    !body.token ||
    body.token.length > MAX_TOKEN_LENGTH
  ) {
    return { error: "Complete the security check." };
  }

  return { report, token: body.token };
}

/*
 * Asks Turnstile whether the token is real, unused and was issued
 * on this site. The secret comes only from the Cloudflare settings
 * (TURNSTILE_SECRET_KEY). The visitor's IP address is not sent.
 *
 * Returns "ok", "failed" (the visitor's token was refused) or
 * "unavailable" (the check itself is broken or unreachable, which
 * is not the visitor's fault). Nothing is logged except fixed text.
 */
async function verifyToken(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error("feedback: the Turnstile secret is not set");

    return "unavailable";
  }

  let response;
  let data;

  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });

    data = await response.json().catch(() => null);
  } catch {
    console.error("feedback: the Turnstile check could not be reached");

    return "unavailable";
  }

  const codes = Array.isArray(data && data["error-codes"])
    ? data["error-codes"]
    : [];

  // A wrong or missing secret is our mistake, not the visitor's.
  if (
    codes.includes("invalid-input-secret") ||
    codes.includes("missing-input-secret")
  ) {
    console.error("feedback: the Turnstile secret was refused");

    return "unavailable";
  }

  if (!response.ok) {
    console.error("feedback: the Turnstile check did not answer");

    return "unavailable";
  }

  if (!data || data.success !== true) {
    return "failed";
  }

  // The check reports the host the widget was shown on.
  if (data.hostname !== new URL(request.url).hostname) {
    return "failed";
  }

  return "ok";
}

async function handle(request, env) {
  if (!isSameOrigin(request)) {
    return fail(403, "Request not allowed.");
  }

  const type = request.headers.get("Content-Type") || "";

  if (!/^application\/json\s*(;|$)/i.test(type)) {
    return fail(415, "Unsupported content type.");
  }

  const bytes = await readBody(request);

  if (bytes === null) {
    return fail(413, "Report is too large.");
  }

  let body;

  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail(400, "Invalid report.");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail(400, "Invalid report.");
  }

  // A person leaves this empty. A bot that fills it gets the
  // same answer as everyone else, and nothing is stored.
  if (body.fb_extra !== undefined && body.fb_extra !== null && body.fb_extra !== "") {
    return reply(200, { ok: true });
  }

  const { report, token, error } = validate(body);

  if (error) {
    return fail(400, error);
  }

  const check = await verifyToken(token, request, env);

  if (check === "failed") {
    return fail(403, "The security check failed. Try again.");
  }

  if (check === "unavailable") {
    return fail(503, "The security check is unavailable. Try again later.");
  }

  // The count and the insert are one statement, so two reports
  // arriving together cannot both pass the cap. created_at is
  // filled in by the table.
  const result = await env.DB.prepare(
    `INSERT INTO reports
       (id, what_happened, what_i_did, what_i_expected, device, email, version)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7
     WHERE (SELECT COUNT(*) FROM reports
            WHERE created_at > datetime('now', '-1 day')) < ?8`,
  )
    .bind(
      crypto.randomUUID(),
      report.happened,
      report.did,
      report.expected,
      report.device,
      report.email,
      report.version,
      DAILY_CAP,
    )
    .run();

  if (result.meta.changes === 0) {
    return fail(429, "Too many reports right now. Try again later.");
  }

  return reply(200, { ok: true });
}

export async function onRequestPost({ request, env }) {
  try {
    return await handle(request, env);
  } catch (error) {
    // The error name only. Messages can carry what was typed.
    console.error("feedback: failed", error && error.name);

    return fail(500, "Something went wrong. Try again later.");
  }
}

// Every other method.
export function onRequest() {
  return fail(405, "Method not allowed.", { Allow: "POST" });
}
