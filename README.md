# BeautyClinic Platform (MVP)

## معرفی
پلتفرم چندکلینیکی BeautyClinic یک SaaS برای مدیریت کلینیک‌های زیبایی است که احراز هویت مبتنی بر OTP (کاوه‌نگار)، طرح رایگان/پولی، پرداخت BitPay و داشبورد وب (Next.js) را در قالب یک مونو ریپو ارائه می‌کند. این سند راه‌اندازی سریع، متغیرهای محیطی و جریان‌های کلیدی MVP را پوشش می‌دهد.

## پشته و معماری
### Backend
- Python 3.12، Django 5، Django REST Framework و SimpleJWT برای API و صدور توکن.
- PostgreSQL برای داده اصلی و Redis برای کش/Rate Limit OTP.
- Celery اختیاری برای صف‌بندی ارسال OTP و وبهوک‌ها.
- Kavenegar برای ارسال کد یک‌بارمصرف و BitPay برای پرداخت اشتراک.

### Frontend
- Next.js (App Router) با TypeScript، TailwindCSS و React Query برای مدیریت داده.
- Zod و React Hook Form برای اعتبارسنجی فرم‌های احراز هویت و عملیات کلینیک.
- ذخیره توکن دسترسی در HttpOnly cookie یا حافظه به همراه Refresh cookie.

### زیرساخت و سرویس‌ها
- Docker Compose برای اجرای PostgreSQL، Redis، Backend و Frontend.
- پیکربندی CORS محدود به مبدأ فرانت‌اند و ثبت لاگ برای OTP و وبهوک پرداخت.

## ساختار مخزن
```
beauty-platform/
├─ README.md
├─ AGENTS.md
├─ docker-compose.yml
├─ .env.example
├─ backend/
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ app/ (Django apps: accounts، clinics، patients، services، appointments، billing)
└─ frontend/
   └─ Dockerfile
```

## راه‌اندازی سریع با Docker
1. کپی کردن فایل‌های نمونه پیکربندی:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. ساخت و اجرای سرویس‌ها:
   ```bash
   docker compose up --build
   ```
3. دسترسی‌ها پس از بالا آمدن کانتینرها:
   - Backend: http://localhost:${BACKEND_PORT:-8000}
   - Frontend: http://localhost:${FRONTEND_PORT:-3000}
   - PostgreSQL: پورت ${POSTGRES_PORT:-5432} با نام سرویس postgres
   - Redis: پورت ${REDIS_PORT:-6379} با نام سرویس redis

## راه‌اندازی توسعه محلی (بدون Docker)
### Backend
1. نصب پیش‌نیازها و فعال‌سازی محیط مجازی:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. تنظیم متغیرها و مهاجرت پایگاه داده:
   ```bash
   cp .env.example .env
   python app/manage.py migrate
   ```
3. اجرای سرور توسعه:
   ```bash
   python app/manage.py runserver 0.0.0.0:8000
   ```

### Frontend
1. نصب وابستگی‌ها:
   ```bash
   cd frontend
   npm install
   ```
2. تنظیم متغیرهای محیطی و اجرای توسعه:
   ```bash
   cp .env.example .env
   npm run dev
   ```

## متغیرهای محیطی
### ریشه (فایل `.env`)
| متغیر | مقدار نمونه/پیش‌فرض | توضیح |
| --- | --- | --- |
| APP_ENV | development | وضعیت اجرای کلی پروژه. |
| POSTGRES_DB | beauty_platform | نام پایگاه داده Postgres. |
| POSTGRES_USER | beauty_user | کاربر پایگاه داده. |
| POSTGRES_PASSWORD | beauty_password | گذرواژه پایگاه داده. |
| POSTGRES_PORT | 5432 | درگاه Postgres برای Docker Compose. |
| REDIS_HOST | redis | میزبان سرویس Redis در شبکه Compose. |
| REDIS_PORT | 6379 | درگاه Redis. |
| BACKEND_PORT | 8000 | درگاه اکسپوز شده Backend. |
| SECRET_KEY | change-me | کلید امنیتی Django. |
| DEBUG | true | فعال‌سازی حالت دیباگ. |
| ALLOWED_HOSTS | * | دامنه‌های مجاز Backend. |
| DATABASE_URL | postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB} | رشته اتصال پایگاه داده. |
| REDIS_URL | redis://${REDIS_HOST}:${REDIS_PORT}/0 | رشته اتصال Redis. |
| CORS_ALLOWED_ORIGINS | http://localhost:3000 | مبدأهای مجاز برای CORS. |
| JWT_ACCESS_TTL_MIN | 15 | مدت اعتبار توکن دسترسی (دقیقه). |
| JWT_REFRESH_TTL_DAYS | 14 | مدت اعتبار توکن رفرش (روز). |
| KAVENEGAR_API_KEY | your-kavenegar-key | کلید API برای ارسال OTP. |
| KAVENEGAR_TEMPLATE_LOGIN | otp-login | نام تمپلیت کاوه‌نگار برای ورود. |
| KAVENEGAR_TEMPLATE_RECOVERY | otp-recovery | نام تمپلیت کاوه‌نگار برای بازیابی. |
| BITPAY_API_KEY | your-bitpay-key | کلید BitPay برای ایجاد پرداخت. |
| BITPAY_WEBHOOK_SECRET | change-me | توکن اعتبارسنجی وبهوک BitPay. |
| BITPAY_RETURN_URL | http://localhost:3000/app/billing/return | مسیر بازگشت پس از پرداخت. |
| BITPAY_WEBHOOK_URL | http://localhost:8000/api/billing/webhook/bitpay | آدرس وبهوک در Backend. |
| FREE_MAX_STAFF | 1 | سقف کاربران در پلن رایگان. |
| FREE_MAX_PATIENTS | 200 | سقف بیمار در پلن رایگان. |
| FREE_MAX_APPOINTMENTS_PER_MONTH | 300 | سقف نوبت ماهانه در پلن رایگان. |
| FRONTEND_PORT | 3000 | درگاه اکسپوز شده Frontend. |
| NEXT_PUBLIC_API_BASE_URL | http://backend:${BACKEND_PORT} | پایه آدرس API برای فرانت‌اند. |
| NEXT_PUBLIC_APP_ENV | development | وضعیت محیط فرانت‌اند. |
| NEXT_PUBLIC_APP_NAME | BeautyClinic | نام نمایشی برنامه در فرانت‌اند. |

### Backend (فایل `backend/.env`)
| متغیر | مقدار نمونه/پیش‌فرض | توضیح |
| --- | --- | --- |
| APP_ENV | development | وضعیت اجرای Backend. |
| BACKEND_PORT | 8000 | درگاه سرویس. |
| SECRET_KEY | change-me | کلید امنیتی Django. |
| DEBUG | true | فعال‌سازی دیباگ. |
| ALLOWED_HOSTS | * | دامنه‌های مجاز. |
| POSTGRES_HOST | postgres | میزبان پایگاه داده. |
| POSTGRES_PORT | 5432 | درگاه پایگاه داده. |
| POSTGRES_DB | beauty_platform | نام پایگاه داده. |
| POSTGRES_USER | beauty_user | کاربر پایگاه داده. |
| POSTGRES_PASSWORD | beauty_password | گذرواژه پایگاه داده. |
| DATABASE_URL | postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB} | رشته اتصال پایگاه داده. |
| REDIS_HOST | redis | میزبان Redis. |
| REDIS_PORT | 6379 | درگاه Redis. |
| REDIS_URL | redis://${REDIS_HOST}:${REDIS_PORT}/0 | رشته اتصال Redis. |
| CORS_ALLOWED_ORIGINS | http://localhost:3000 | مبدأهای مجاز CORS. |
| JWT_ACCESS_TTL_MIN | 15 | مدت اعتبار توکن دسترسی. |
| JWT_REFRESH_TTL_DAYS | 14 | مدت اعتبار توکن رفرش. |
| KAVENEGAR_API_KEY | your-kavenegar-key | کلید API کاوه‌نگار. |
| KAVENEGAR_TEMPLATE_LOGIN | otp-login | تمپلیت پیامک ورود. |
| KAVENEGAR_TEMPLATE_RECOVERY | otp-recovery | تمپلیت پیامک بازیابی. |
| BITPAY_API_KEY | your-bitpay-key | کلید BitPay. |
| BITPAY_WEBHOOK_SECRET | change-me | توکن اعتبارسنجی وبهوک. |
| BITPAY_RETURN_URL | http://localhost:3000/app/billing/return | مسیر بازگشت پس از پرداخت. |
| BITPAY_WEBHOOK_URL | http://localhost:8000/api/billing/webhook/bitpay | آدرس وبهوک Backend. |
| FREE_MAX_STAFF | 1 | سقف کاربران پلن رایگان. |
| FREE_MAX_PATIENTS | 200 | سقف بیمار پلن رایگان. |
| FREE_MAX_APPOINTMENTS_PER_MONTH | 300 | سقف نوبت ماهانه پلن رایگان. |

### Frontend (فایل `frontend/.env`)
| متغیر | مقدار نمونه/پیش‌فرض | توضیح |
| --- | --- | --- |
| NEXT_PUBLIC_API_BASE_URL | http://backend:8000 | آدرس پایه API. |
| NEXT_PUBLIC_APP_ENV | development | وضعیت محیط فرانت‌اند. |
| NEXT_PUBLIC_APP_NAME | BeautyClinic | نام نمایشی برنامه. |

## جریان‌های کلیدی
- **احراز هویت OTP (کاوه‌نگار):** ارسال کد ۶ رقمی با تمپلیت‌های ورود و بازیابی، نگهداری هش OTP و محدودیت نرخ ارسال (۳ بار در ۱۰ دقیقه). پس از تایید، کاربر و کلینیک اولیه ایجاد می‌شود.
- **مدیریت کلینیک و نقش‌ها:** کاربران با نقش OWNER و STAFF (و امکان DOCTOR) در یک پایگاه داده مشترک نگهداری می‌شوند و تمامی کوئری‌ها بر اساس `clinic_id` محدود می‌شوند.
- **رزرو و پرونده:** بیمار، خدمت، نوبت و Procedure با وضعیت‌های SCHEDULED/CHECKED_IN/DONE/CANCELED/NO_SHOW و نسبت‌دهی به کاربر ایجادکننده ذخیره می‌شود.
- **پرداخت و اشتراک:** پلن FREE/Paid با BitPay مدیریت می‌شود. ایجاد Checkout از Backend انجام می‌شود، فعال‌سازی پلن تنها پس از وبهوک موفق BitPay صورت می‌گیرد و وضعیت اشتراک در `/app/billing` نمایش داده می‌شود.

## تست و کیفیت
- اجرای تست‌های Backend (پس از نصب وابستگی‌ها):
  ```bash
  cd backend
  source .venv/bin/activate
  python app/manage.py test
  ```
- اجرای Lint/تست‌های Frontend (در صورت فعال بودن اسکریپت‌ها):
  ```bash
  cd frontend
  npm test
  ```

## نکات امنیت و عملیات
- مقادیر محرمانه (کلیدها و توکن‌ها) را فقط در فایل‌های `.env` نگه دارید و در کنترل نسخه قرار ندهید.
- دسترسی CORS را به دامنه‌های مورد اعتماد محدود کنید و طول عمر توکن‌ها را مطابق نیاز محیط تولید کاهش دهید.
- لاگ OTP و پرداخت را بدون ثبت کد خام یا داده کارت نگه‌داری کنید و وبهوک BitPay را با `BITPAY_WEBHOOK_SECRET` اعتبارسنجی نمایید.
