# Beauty Platform

Docker-first scaffold with FastAPI backend and Next.js frontend.

## ساخت و اجرای محلی
1. فایل‌های مثال را کپی کنید:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. سرویس‌ها را با Docker Compose بالا بیاورید:
   ```bash
   docker compose up --build
   ```
3. سرویس‌ها:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
   - Postgres: پورت 5432 (نام سرویس `postgres`)
   - Redis: پورت 6379 (نام سرویس `redis`)

## متغیرهای محیطی
- `.env.example`: مقادیر Docker Compose (درگاه‌ها و اتصال پایگاه داده/ردیس).
- `backend/.env.example`: پیکربندی برنامه FastAPI (اتصال Postgres/Redis و تنظیمات امنیتی).
- `frontend/.env.example`: آدرس API برای Next.js و وضعیت محیط.

تمام مقادیر پیش‌فرض با PRD هم‌راستا شده‌اند (درگاه 8000/3000، Postgres/Redis محلی). در صورت نیاز به به‌روزرسانی، فایل‌های `.env` را بعد از کپی ویرایش کنید.
