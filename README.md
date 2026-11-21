# PizzaHub — Server (Express, ES Modules)

## Stack
Express 4 · Mongoose 8 · JWT · Stripe Checkout + Webhook · ImgBB proxy · Nodemailer

## Install
npm install
cp .env.example .env   # fill values
npm run seed:admin
npm run dev

## Env keys
PORT NODE_ENV CLIENT_URL MONGODB_URI DB_NAME BETTER_AUTH_URL JWT_SECRET
STRIPE_SECRET_KEY PREMIUM_PRICE_CENTS STRIPE_CURRENCY STRIPE_WEBHOOK_SECRET
IMGBB_API_KEY SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS MAIL_FROM
ADMIN_EMAIL ADMIN_PASSWORD ADMIN_NAME

## Endpoints
POST /api/auth/sync, GET /api/auth/me
GET/PATCH /api/users ...
GET/POST/PATCH/DELETE /api/menuItems ...
GET/POST/PATCH /api/orders ...
GET /api/transactions (admin)
POST /api/stripe/checkout, POST /api/stripe/webhook, GET /api/stripe/session/:id
POST /api/upload

## Advanced search / sort
GET /api/menuItems?search=&category=&location=&sort=price_asc|price_desc&page=&limit=