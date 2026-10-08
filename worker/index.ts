import { EmailMessage } from "cloudflare:email";
import { Mailbox, createMimeMessage } from "mimetext/browser";

const OWNER = "andreiradoi14@gmail.com";
const FROM_ADDR = "brief@rvandrei.com";
const FROM_NAME = "Rvandrei brief";

const MAX_BODY = 4 * 1024 * 1024 + 512 * 1024; // whole request cap (sketch 1.5 MB + photo 2 MB + text)
const MAX_SKETCH = 1.5 * 1024 * 1024;
const MAX_PHOTO = 2 * 1024 * 1024;
const MAX_SUMMARY = 4000;

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

function originAllowed(origin: string | null): boolean {
	if (!origin) return false;
	let u: URL;
	try {
		u = new URL(origin);
	} catch {
		return false;
	}
	if (u.protocol !== "https:") return false;
	const h = u.hostname;
	return h === "rvandrei.com" || h === "www.rvandrei.com" || h.endsWith(".andreiradoi14.workers.dev");
}

function json(body: Record<string, unknown>, status = 200, extra: HeadersInit = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			"x-content-type-options": "nosniff",
			...extra,
		},
	});
}
const fail = (error: string, status: number) => json({ ok: false, error }, status);

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const oneLine = (s: string) => s.replace(/[\r\n\u2028\u2029]+/g, " ").trim();

function str(v: string | File | null, max: number): string | null {
	if (v === null) return "";
	if (typeof v !== "string") return null;
	return v.length > max ? null : v;
}
function strList(v: unknown, maxItems = 30, maxLen = 80): string[] {
	if (!Array.isArray(v)) return [];
	return v.filter((x): x is string => typeof x === "string").slice(0, maxItems).map((x) => oneLine(x).slice(0, maxLen));
}

function sniff(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
	if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
	if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
	if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
	return null;
}

function toBase64(bytes: Uint8Array): string {
	let bin = "";
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

async function verifyTurnstile(token: string, ip: string | null, secret: string): Promise<boolean> {
	if (!token || token.length > 2048) return false;
	const body = new URLSearchParams({ secret, response: token });
	if (ip) body.set("remoteip", ip);
	try {
		const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			body,
			signal: AbortSignal.timeout(10_000),
		});
		if (!r.ok) return false;
		const data = (await r.json()) as { success?: boolean };
		return data.success === true;
	} catch {
		return false;
	}
}

interface Answers {
	building: string[];
	stage: string;
	features: string[];
	kind: string[];
	timing: string;
	notes: string;
	link: string;
}

function parseAnswers(raw: string): Answers | null {
	let a: unknown;
	try {
		a = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!a || typeof a !== "object" || Array.isArray(a)) return null;
	const o = a as Record<string, unknown>;
	const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
	return {
		building: strList(o.building),
		stage: oneLine(s(o.stage, 80)),
		features: strList(o.features),
		kind: strList(o.kind),
		timing: oneLine(s(o.timing, 80)),
		notes: s(o.notes, 4000),
		link: oneLine(s(o.link, 500)),
	};
}

async function handleBrief(request: Request, env: Env): Promise<Response> {
	if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, { allow: "POST" });
	if (!originAllowed(request.headers.get("Origin"))) return fail("forbidden", 403);

	const len = Number(request.headers.get("Content-Length") ?? "0");
	if (!Number.isFinite(len) || len > MAX_BODY) return fail("invalid", 400);
	if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("multipart/form-data")) return fail("invalid", 400);

	const ip = request.headers.get("CF-Connecting-IP");
	const { success: allowed } = await env.BRIEF_LIMITER.limit({ key: ip ?? "unknown" });
	if (!allowed) return fail("rate_limited", 429);

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return fail("invalid", 400);
	}

	// Honeypot: pretend success so bots learn nothing.
	const hp = form.get("website");
	if (typeof hp === "string" ? hp !== "" : hp !== null) return json({ ok: true });

	const name = str(form.get("name"), 100);
	const email = str(form.get("email"), 254);
	const company = str(form.get("company"), 100);
	const whatsapp = str(form.get("whatsapp"), 40);
	const summary = str(form.get("summary"), MAX_SUMMARY);
	const answersRaw = str(form.get("answers"), 20_000);
	const token = str(form.get("cf-turnstile-response"), 2048);
	if (name === null || email === null || company === null || whatsapp === null || summary === null || answersRaw === null || token === null) return fail("invalid", 400);

	const cleanName = oneLine(name);
	const cleanEmail = email.trim();
	if (!cleanName || !EMAIL_RE.test(cleanEmail) || /[\r\n]/.test(cleanEmail)) return fail("invalid", 400);
	const answers = parseAnswers(answersRaw || "{}");
	if (!answers) return fail("invalid", 400);

	// Files
	const attachments: { filename: string; mime: string; data: string }[] = [];
	for (const [field, max, types] of [
		["sketch", MAX_SKETCH, ["image/png"]],
		["photo", MAX_PHOTO, ["image/png", "image/jpeg", "image/webp"]],
	] as const) {
		const f = form.get(field);
		if (f === null || (typeof f === "string" && f === "")) continue;
		if (typeof f === "string") return fail("invalid", 400);
		if (f.size === 0) continue;
		if (f.size > max) return fail("invalid", 400);
		const bytes = new Uint8Array(await f.arrayBuffer());
		const kind = sniff(bytes);
		if (!kind || !(types as readonly string[]).includes(kind)) return fail("invalid", 400);
		const ext = kind === "image/jpeg" ? "jpg" : kind === "image/png" ? "png" : "webp";
		attachments.push({ filename: `${field}.${ext}`, mime: kind, data: toBase64(bytes) });
	}

	if (!(await verifyTurnstile(token, ip, env.TURNSTILE_SECRET))) return fail("turnstile", 403);

	const firstBuilding = answers.building[0] ?? "project";
	const subject = oneLine(`New brief: ${firstBuilding} \u2014 ${cleanName}`).slice(0, 200);
	const rows: [string, string][] = [
		["Name", cleanName],
		["Email", cleanEmail],
		["Company", oneLine(company)],
		["WhatsApp", oneLine(whatsapp)],
		["Building", answers.building.join(", ")],
		["Stage", answers.stage],
		["Features", answers.features.join(", ")],
		["Kind", answers.kind.join(", ")],
		["Timing", answers.timing],
		["Link", answers.link],
	];
	const shown = rows.filter(([, v]) => v);
	const text =
		`${summary || "(no summary)"}\n\n---\n` +
		shown.map(([k, v]) => `${k}: ${v}`).join("\n") +
		(answers.notes ? `\n\nNotes:\n${answers.notes}` : "") +
		(attachments.length ? `\n\nAttachments: ${attachments.map((a) => a.filename).join(", ")}` : "");
	const html =
		`<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#222">` +
		`<p style="white-space:pre-wrap">${esc(summary || "(no summary)")}</p><hr>` +
		`<table cellpadding="4" style="font-size:14px">${shown.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table>` +
		(answers.notes ? `<p><b>Notes</b></p><p style="white-space:pre-wrap">${esc(answers.notes)}</p>` : "") +
		(attachments.length ? `<p><i>Attachments: ${esc(attachments.map((a) => a.filename).join(", "))}</i></p>` : "") +
		`</div>`;

	try {
		const msg = createMimeMessage();
		msg.setSender({ name: FROM_NAME, addr: FROM_ADDR });
		msg.setRecipient(OWNER);
		msg.setHeader("Reply-To", new Mailbox({ name: cleanName.replace(/["\\<>]/g, ""), addr: cleanEmail }));
		msg.setSubject(subject);
		msg.addMessage({ contentType: "text/plain", data: text });
		msg.addMessage({ contentType: "text/html", data: html });
		for (const a of attachments) {
			msg.addAttachment({ filename: a.filename, contentType: a.mime, data: a.data, encoding: "base64" });
		}
		await env.BRIEF_MAIL.send(new EmailMessage(FROM_ADDR, OWNER, msg.asRaw()));
	} catch (err) {
		console.error(JSON.stringify({ event: "brief_email_failed", code: (err as { code?: string })?.code ?? "unknown" }));
		return fail("email_failed", 502);
	}
	return json({ ok: true });
}

export default {
	async fetch(request, env): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname === "/api/brief") {
			try {
				return await handleBrief(request, env);
			} catch {
				console.error(JSON.stringify({ event: "brief_unhandled" }));
				return fail("email_failed", 502);
			}
		}
		if (pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
