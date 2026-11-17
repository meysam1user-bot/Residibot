# Residibot

ربات تلگرام رسیدساز — Cloudflare Worker + resvg-wasm

## گام ۱ — ساخت KV
داشبورد Cloudflare → Storage & Databases → KV → Create namespace
نام: STATE
شناسهٔ ساخته‌شده را در wrangler.toml جای PASTE_KV_ID_HERE بگذار.

## گام ۲ — ریپو
یک ریپوی خصوصی در گیت‌هاب بساز و این فایل‌ها را آپلود کن.
(بدون node_modules — Build خودش نصب می‌کند)

## گام ۳ — اتصال به Cloudflare
Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
ریپو را انتخاب کن.

Build command:   npm install
Deploy command:  npx wrangler deploy

ذخیره و Deploy.

## گام ۴ — وبهوک
بعد از دیپلوی، آدرس ورکر را باز کن و به انتهایش /setup اضافه کن:

    https://residibot.<your-subdomain>.workers.dev/setup

پاسخ باید {"ok":true} باشد. برای بررسی وضعیت: /info

## گام ۵ — استفاده
1. در ربات /template بزن و عکس رسید را به‌صورت فایل (Document) بفرست
2. /sample بزن و خروجی را با اصل مقایسه کن
3. اگر فیلدی جابه‌جا بود: /nudge → فیلد → با دکمه‌ها تنظیم کن
4. /new برای ساخت رسید

## دستورها
| دستور | کار |
|---|---|
| /template | ثبت عکس قالب |
| /sample | رندر نمونه برای تنظیم |
| /nudge | تنظیم موقعیت و اندازهٔ فیلدها |
| /new | ساخت رسید |

## امنیت
ربات فقط برای ADMIN_ID کار می‌کند. توکن و WEBHOOK_SECRET داخل src/index.js هستند.
اگر توکن لو رفت، از BotFather /revoke بزن و مقدار BOT_TOKEN را عوض کن.

## محدودیت رقم‌ها
| فیلد | مجاز |
|---|---|
| نام | ۲–۳۲ کاراکتر |
| شبا | دقیقاً ۲۴ رقم |
| مبلغ | ۱–۱۲ رقم |
| تاریخ | ۴۰ کاراکتر یا خودکار |
| انتقال‌دهنده | ۲–۳۲ کاراکتر |
| شماره پیگیری | ۲۰–۳۲ رقم |

## نکته
- پلن Free ممکن است برای رستر ۱۰۸۰×۲۰۴۱ به سقف CPU بخورد. اگر خطا گرفتی، پلن Paid لازم است.
- فونت Vazirmatn خودکار از jsDelivr لود و در KV کش می‌شود.
