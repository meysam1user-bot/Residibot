import { initWasm, Resvg } from "@cf-wasm/resvg/workerd";

/* ─────────── تنظیمات ─────────── */
const BOT_TOKEN = "9219136751:AAGAPEJAVm2zy3ZViOtP2ExvQKbEKX9KrqU";
const WEBHOOK_SECRET = "wsk_7f3a91c2e5b84d06a1f2c8d4";
const ADMIN_ID = 567874013;

const W = 1080, H = 2041, BG = "#fbfcfd";
const FA = "۰۱۲۳۴۵۶۷۸۹";
const fa = (s) => String(s).replace(/[0-9]/g, (d) => FA[+d]);
const en = (s) => String(s)
  .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
  .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632);
const digits = (s) => en(s).replace(/\D/g, "");
const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const toB64 = (buf) => {
  const b = new Uint8Array(buf);
  let o = "";
  for (let i = 0; i < b.length; i += 8192) o += String.fromCharCode(...b.subarray(i, i + 8192));
  return btoa(o);
};
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/* ─────────── فیلدها ─────────── */
const FIELDS = {
  name:        { rect: [180, 365, 900, 415], x: 540, y: 372, size: 44, color: "#1c1c1c", anchor: "middle", dir: "rtl", weight: 700, label: "نام صاحب حساب" },
  sheba_owner: { rect: [180, 440, 900, 482], x: 540, y: 448, size: 28, color: "#7b8b92", anchor: "middle", dir: "ltr", weight: 400, label: "شبا صاحب حساب" },
  amount:      { rect: [120, 512, 960, 596], x: 540, y: 522, size: 70, color: "#1a1a1a", anchor: "middle", dir: "rtl", weight: 700, label: "مبلغ (ریال)" },
  date:        { rect: [25, 925, 790, 988],  x: 40,  y: 936, size: 31, color: "#1c1c1c", anchor: "start",  dir: "ltr", weight: 400, label: "تاریخ و ساعت" },
  sender:      { rect: [25, 1055, 790, 1118], x: 40, y: 1066, size: 33, color: "#1c1c1c", anchor: "start", dir: "rtl", weight: 400, label: "نام انتقال‌دهنده" },
  method:      { rect: [25, 1185, 790, 1248], x: 40, y: 1196, size: 33, color: "#1c1c1c", anchor: "start", dir: "rtl", weight: 400, label: "روش انتقال" },
  sheba_src:   { rect: [25, 1315, 790, 1378], x: 40, y: 1326, size: 30, color: "#1c1c1c", anchor: "start", dir: "ltr", weight: 400, label: "شبا سپرده مبدأ" },
  tracking:    { rect: [25, 1445, 790, 1508], x: 40, y: 1456, size: 29, color: "#1c1c1c", anchor: "start", dir: "ltr", weight: 400, label: "شماره پیگیری" },
};

const METHODS = ["بین بانکی (پل)", "پایا", "ساتنا", "کارت به کارت", "درون‌بانکی"];
const AV = { x: 450, y: 185, w: 180, h: 180, cx: 540, cy: 275, r: 90 };
const BADGE = [440, 306, 54, 54];

const FONT_URLS = {
  r: ["https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/fonts/ttf/Vazirmatn-Regular.ttf",
      "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf"],
  b: ["https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/fonts/ttf/Vazirmatn-Bold.ttf",
      "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf"],
};

const fmtSheba = (d) => `IR - ${d.slice(0, 2)} ${d.slice(2, 22).match(/.{4}/g).join(" ")} ${d.slice(22)}`;
const fmtAmount = (n) => fa(Number(n).toLocaleString("en-US")) + " ریال";
const randDigits = (n) => fa(Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b % 10).join(""));

function fmtDate(dt) {
  const p = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(dt);
  const g = (t) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")} ${g("month")} ${g("day")}، ${g("weekday")} ${g("hour")}:${g("minute")}`;
}
const jalaliNow = () => fmtDate(new Date());

function parseJalali(s) {
  const m = en(s).match(/^\s*(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?\s*$/);
  if (!m) return null;
  const [, jy, jm, jd, hh, mm] = m.map(Number);
  const leap = ((jy + 12) % 33) % 4;
  const md = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, leap === 1 ? 30 : 29];
  if (jm < 1 || jm > 12 || jd < 1 || jd > md[jm - 1]) return null;
  let n = jd;
  for (let i = 0; i < jm - 1; i++) n += md[i];
  const dt = new Date(Date.UTC(jy + 621, 0, 1) + (n + (leap === 0 ? 79 : 80) - 1) * 864e5);
  dt.setUTCHours(hh || 0, mm || 0, 0, 0);
  return isNaN(dt) ? null : fmtDate(dt);
}

/* ─────────── منابع ─────────── */
async function getFont(env, w) {
  const cached = await env.STATE.get(`font:${w}`, "base64");
  if (cached) return fromB64(cached);
  for (const url of FONT_URLS[w]) {
    const r = await fetch(url);
    if (!r.ok) continue;
    const buf = new Uint8Array(await r.arrayBuffer());
    await env.STATE.put(`font:${w}`, toB64(buf));
    return buf;
  }
  throw new Error("font unavailable");
}

const getTpl = (env) => env.STATE.get("tpl", "base64");
const getOff = async (env) => JSON.parse((await env.STATE.get("off")) || "{}");

/* ─────────── SVG ─────────── */
function buildSvg(data, tplB64, avatarB64, off) {
  const tpl = `data:image/png;base64,${tplB64}`;
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`];
  o.push(`<image href="${tpl}" width="${W}" height="${H}"/>`);

  for (const [k, f] of Object.entries(FIELDS)) {
    if (!data[k]) continue;
    const [dx, dy] = off[k] || [0, 0];
    const [x1, y1, x2, y2] = f.rect;
    o.push(`<rect x="${x1 + dx}" y="${y1 + dy}" width="${x2 - x1}" height="${y2 - y1}" fill="${BG}"/>`);
  }

  if (avatarB64) {
    o.push(`<clipPath id="av"><circle cx="${AV.cx}" cy="${AV.cy}" r="${AV.r}"/></clipPath>`);
    o.push(`<image href="data:image/jpeg;base64,${avatarB64}" x="${AV.x}" y="${AV.y}" width="${AV.w}" height="${AV.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#av)"/>`);
    o.push(`<svg x="${BADGE[0]}" y="${BADGE[1]}" width="${BADGE[2]}" height="${BADGE[3]}" viewBox="${BADGE.join(" ")}"><image href="${tpl}" width="${W}" height="${H}"/></svg>`);
  }

  for (const [k, f] of Object.entries(FIELDS)) {
    if (!data[k]) continue;
    const [dx, dy, ds] = off[k] || [0, 0, 0];
    o.push(
      `<text x="${f.x + dx}" y="${f.y + dy}" font-size="${f.size + (ds || 0)}" font-weight="${f.weight}" ` +
      `fill="${f.color}" text-anchor="${f.anchor}" direction="${f.dir}" xml:lang="fa">${esc(data[k])}</text>`
    );
  }

  o.push("</svg>");
  return o.join("");
}

async function render(env, data, avatarBuf) {
  const tplB64 = await getTpl(env);
  if (!tplB64) throw new Error("no-template");
  await initWasm();
  const [fr, fb, off] = await Promise.all([getFont(env, "r"), getFont(env, "b"), getOff(env)]);
  const svg = buildSvg(data, tplB64, avatarBuf ? toB64(avatarBuf) : null, off);
  const resvg = new Resvg(svg, {
    font: { fontBuffers: [fr, fb], loadSystemFonts: false, defaultFontFamily: "Vazirmatn" },
    fitTo: { mode: "width", value: W },
  });
  return resvg.render().asPng();
}

/* ─────────── تلگرام ─────────── */
const api = (m, body) =>
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${m}`, {
    method: "POST",
    headers: body instanceof FormData ? {} : { "content-type": "application/json" },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

const say = (chat, text, kb) =>
  api("sendMessage", { chat_id: chat, text, parse_mode: "HTML", reply_markup: kb });

async function sendPhoto(chat, png, caption = "✅ رسید آماده‌ست.\n/new برای ساخت بعدی") {
  const fd = new FormData();
  fd.append("chat_id", chat);
  fd.append("caption", caption);
  fd.append("photo", new Blob([png], { type: "image/png" }), "receipt.png");
  await api("sendPhoto", fd);
}

async function download(fileId) {
  const r = await api("getFile", { file_id: fileId }).then((x) => x.json());
  if (!r.ok) throw new Error("getFile failed");
  const f = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${r.result.file_path}`);
  return f.arrayBuffer();
}

const skipKb = { inline_keyboard: [[{ text: "رد کردن ⏭", callback_data: "skip" }]] };
const ORDER = ["name", "sheba_owner", "amount", "date", "sender", "method", "sheba_src", "tracking", "avatar"];

const STEP_TEXT = {
  name: "۱ از ۸ — نام و نام خانوادگی صاحب حساب؟",
  sheba_owner: "۲ از ۸ — شماره شبا صاحب حساب؟ (۲۴ رقم)",
  amount: "۳ از ۸ — مبلغ به ریال؟ (فقط رقم، حداکثر ۱۲ رقم)",
  date: "۴ از ۸ — تاریخ و ساعت؟ (۱۴۰۵/۰۸/۱۷ ۱۸:۳۱)\nیا رد کن تا الان ثبت بشه.",
  sender: "۵ از ۸ — نام انتقال‌دهنده؟",
  method: "۶ از ۸ — روش انتقال؟",
  sheba_src: "۷ از ۸ — شبا سپرده مبدأ؟ (۲۴ رقم)",
  tracking: "۸ از ۸ — شماره پیگیری؟ (۲۰ تا ۳۲ رقم)\nیا رد کن تا خودکار ساخته بشه.",
  avatar: "عکس پروفایل رو بفرست، یا رد کن تا عکس پیش‌فرض بمونه.",
};

const getState = async (env, chat) => JSON.parse((await env.STATE.get(`s:${chat}`)) || "null");
const setState = (env, chat, v) => env.STATE.put(`s:${chat}`, JSON.stringify(v), { expirationTtl: 1800 });

async function advance(env, chat, step, data) {
  await setState(env, chat, { step, data });
  const kb = step === "method"
    ? { inline_keyboard: METHODS.map((m) => [{ text: m, callback_data: `m:${m}` }]) }
    : ["date", "tracking", "avatar"].includes(step) ? skipKb : undefined;
  await say(chat, STEP_TEXT[step], kb);
}

async function finish(env, chat, data, avatar) {
  await env.STATE.delete(`s:${chat}`);
  try {
    await sendPhoto(chat, await render(env, data, avatar));
  } catch (e) {
    await say(chat, e.message === "no-template"
      ? "قالب تنظیم نشده. اول عکس رسید رو با /template به‌صورت فایل بفرست."
      : "خطا در ساخت رسید: " + e.message);
  }
}

/* ─────────── تنظیم مختصات ─────────── */
const nudgeKb = (f) => ({
  inline_keyboard: [
    [{ text: "◀ چپ", callback_data: `n:${f}:l` }, { text: "▲ بالا", callback_data: `n:${f}:u` },
     { text: "▼ پایین", callback_data: `n:${f}:d` }, { text: "راست ▶", callback_data: `n:${f}:r` }],
    [{ text: "−۵ چپ", callback_data: `n:${f}:L` }, { text: "−۵ بالا", callback_data: `n:${f}:U` },
     { text: "−۵ پایین", callback_data: `n:${f}:D` }, { text: "+۵ راست", callback_data: `n:${f}:R` }],
    [{ text: "کوچک‌تر", callback_data: `n:${f}:s` }, { text: "بزرگ‌تر", callback_data: `n:${f}:S` },
     { text: "صفر کن", callback_data: `n:${f}:z` }],
    [{ text: "🔙 فیلد دیگر", callback_data: "nmenu" }],
  ],
});

const fieldMenu = {
  inline_keyboard: [...Object.entries(FIELDS).map(([k, f]) => [{ text: f.label, callback_data: `n:${k}:i` }]),
    [{ text: "↩️ ریست همه", callback_data: "nreset" }]],
};

async function applyNudge(env, field, op, delta) {
  const off = await getOff(env);
  const cur = off[field] || [0, 0, 0];
  if (op === "z") off[field] = [0, 0, 0];
  else {
    if (op === "l") cur[0] -= delta;
    if (op === "r") cur[0] += delta;
    if (op === "u") cur[1] -= delta;
    if (op === "d") cur[1] += delta;
    if (op === "s") cur[2] -= delta;
    if (op === "S") cur[2] += delta;
    off[field] = cur;
  }
  await env.STATE.put("off", JSON.stringify(off));
}

const SAMPLE = {
  name: "میثم اکبری‌عسکرانی",
  sheba_owner: "IR - ۶۱ ۰۱۷۰ ۰۰۰۰ ۰۰۳۶ ۱۴۲۹ ۹۰۸۰ ۰۲",
  amount: "۲,۰۰۰,۰۰۰ ریال",
  date: "۱۴۰۵ آبان ۱۷، یکشنبه ۱۸:۳۱",
  sender: "میثم اکبری عسکرانی",
  method: "بین بانکی (پل)",
  sheba_src: "IR - ۳۸ ۰۵۶۰ ۶۱۱۸ ۲۸۸۰ ۵۸۸۶ ۶۶۱۵ ۰۱",
  tracking: "۱۴۰۵۰۸۱۷۱۸۳۱۱۰۷۲۰۵۶۳۸۷۴۵۰۴۲۷۴",
};

/* ─────────── روتر ─────────── */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "GET") {
      if (url.pathname === "/setup") {
        const r = await api("setWebhook", {
          url: url.origin + "/",
          secret_token: WEBHOOK_SECRET,
          drop_pending_updates: true,
          allowed_updates: ["message", "callback_query"],
        }).then((x) => x.json());
        return new Response(JSON.stringify(r, null, 2), { headers: { "content-type": "application/json" } });
      }
      if (url.pathname === "/info") {
        const r = await api("getWebhookInfo", {}).then((x) => x.json());
        return new Response(JSON.stringify(r, null, 2), { headers: { "content-type": "application/json" } });
      }
      return new Response("residibot ok");
    }

    if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== WEBHOOK_SECRET)
      return new Response("forbidden", { status: 403 });

    const u = await req.json();
    const msg = u.message, cb = u.callback_query;
    const chat = msg?.chat?.id ?? cb?.message?.chat?.id;
    if (!chat) return new Response("ok");

    if (chat !== ADMIN_ID) {
      if (cb) return api("answerCallbackQuery", { callback_query_id: cb.id, text: "دسترسی نداری", show_alert: true });
      return say(chat, "این ربات خصوصی است. آیدی تو: <code>" + chat + "</code>");
    }

    if (msg?.text?.startsWith("/start") || msg?.text === "/new") {
      if (!(await getTpl(env)))
        return say(chat, "اول عکس رسید رو <b>به‌صورت فایل</b> با /template بفرست.");
      await setState(env, chat, { step: "name", data: {} });
      const head = msg.text.startsWith("/start") ? "📝 <b>رسیدساز</b>\n\n" : "";
      return say(chat, head + STEP_TEXT.name);
    }

    if (msg?.text === "/template") {
      await setState(env, chat, { step: "template", data: {} });
      return say(chat, "عکس رسید رو <b>به‌صورت فایل (Document)</b> بفرست، بدون فشرده‌سازی.");
    }

    if (msg?.text === "/nudge") return say(chat, "کدام فیلد؟", fieldMenu);

    if (msg?.text === "/sample") {
      try { return await sendPhoto(chat, await render(env, SAMPLE, null), "نمونه") }
      catch (e) { return say(chat, "خطا: " + e.message) }
    }

    if (cb) {
      await api("answerCallbackQuery", { callback_query_id: cb.id });
      const d = cb.data;

      if (d === "nmenu") return say(chat, "کدام فیلد؟", fieldMenu);
      if (d === "nreset") {
        await env.STATE.delete("off");
        return say(chat, "مختصات ریست شد.", fieldMenu);
      }
      if (d.startsWith("n:")) {
        const [, f, op] = d.split(":");
        if (op === "i") return say(chat, `تنظیم «${FIELDS[f].label}»`, nudgeKb(f));
        const delta = ["L", "R", "U", "D", "S"].includes(op) ? 5 : 1;
        await applyNudge(env, f, op, delta);
        try { await sendPhoto(chat, await render(env, SAMPLE, null), `«${FIELDS[f].label}»`) }
        catch (e) { await say(chat, "خطا: " + e.message) }
        return say(chat, "ادامه بده یا فیلد دیگر:", nudgeKb(f));
      }
      if (d.startsWith("m:")) {
        const st = await getState(env, chat);
        if (!st) return new Response("ok");
        st.data.method = d.slice(2);
        return advance(env, chat, "sheba_src", st.data);
      }
      if (d === "skip") {
        const st = await getState(env, chat);
        if (!st) return new Response("ok");
        if (st.step === "date") st.data.date = jalaliNow();
        else if (st.step === "tracking") st.data.tracking = randDigits(29);
        else if (st.step === "avatar") return finish(env, chat, st.data, null);
        return advance(env, chat, ORDER[ORDER.indexOf(st.step) + 1], st.data);
      }
      return new Response("ok");
    }

    const st = await getState(env, chat);
    if (!st) return new Response("ok");
    const { step, data } = st;
    const next = () => advance(env, chat, ORDER[ORDER.indexOf(step) + 1], data);
    const txt = (msg.text || "").trim();

    if (step === "template") {
      const fileId = msg.document?.file_id || msg.photo?.[msg.photo.length - 1]?.file_id;
      if (!fileId) return say(chat, "فایل عکس بفرست.");
      await env.STATE.put("tpl", toB64(await download(fileId)));
      await env.STATE.delete(`s:${chat}`);
      return say(chat, "قالب ذخیره شد. /new برای ساخت رسید.");
    }

    switch (step) {
      case "name":
        if (txt.length < 2 || txt.length > 32) return say(chat, "نام باید بین ۲ تا ۳۲ کاراکتر باشه.");
        data.name = txt; return next();
      case "sheba_owner": {
        const d = digits(txt);
        if (d.length !== 24) return say(chat, `شبا باید دقیقاً ۲۴ رقم باشه. الان ${fa(d.length)} رقمه.`);
        data.sheba_owner = fmtSheba(d); return next();
      }
      case "amount": {
        const d = digits(txt);
        if (d.length < 1 || d.length > 12) return say(chat, "مبلغ باید بین ۱ تا ۱۲ رقم باشه.");
        data.amount = fmtAmount(d); return next();
      }
      case "date": {
        const v = parseJalali(txt);
        if (!v) return say(chat, "قالب درست نیست. مثال: ۱۴۰۵/۰۸/۱۷ ۱۸:۳۱");
        data.date = v; return next();
      }
      case "sender":
        if (txt.length < 2 || txt.length > 32) return say(chat, "نام باید بین ۲ تا ۳۲ کاراکتر باشه.");
        data.sender = txt; return next();
      case "sheba_src": {
        const d = digits(txt);
        if (d.length !== 24) return say(chat, `شبا باید دقیقاً ۲۴ رقم باشه. الان ${fa(d.length)} رقمه.`);
        data.sheba_src = fmtSheba(d); return next();
      }
      case "tracking": {
        const d = digits(txt);
        if (d.length < 20 || d.length > 32) return say(chat, `شماره پیگیری باید بین ۲۰ تا ۳۲ رقم باشه. الان ${fa(d.length)} رقمه.`);
        data.tracking = fa(d); return next();
      }
      case "avatar": {
        if (!msg.photo && !msg.document) return say(chat, "عکس بفرست یا «رد کردن» رو بزن.", skipKb);
        const fileId = msg.document?.file_id || msg.photo[msg.photo.length - 1].file_id;
        return finish(env, chat, data, await download(fileId));
      }
    }
    return new Response("ok");
  },
};
