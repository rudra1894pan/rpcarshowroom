# RP Car Showroom

A multi-seller used-car marketplace. Buyers browse verified listings, see
each car's insurance status, book test rides, request insurance quotes, and
leave reviews. Sellers apply for approval and list their own cars. Admin
approves sellers, approves each car listing, confirms/rejects test rides,
manages insurance plans, and issues/rejects insurance policies — buyers are
emailed on every decision that affects them.

## Stack
- MongoDB (Mongoose)
- Express REST API
- Angular 19 (standalone components, signals, lazy-loaded routes)
- Node.js
- Nodemailer for email notifications
- Multer for car photos + insurance policy document uploads

## Project structure
```
rpcarshowroom/
  backend/     Express API (models, routes, controllers, email, uploads)
  frontend/    Angular app (dark/gold theme, mobile-responsive)
```

## Roles & flow
- **Buyer** (default role on registration): browses cars, views insurance
  details, books test rides, requests insurance quotes with a live premium
  calculator, leaves reviews on cars, tracks everything under My Bookings /
  My Insurance. **Buyers cannot list cars.**
- **Seller**: applies via "Sell Your Car" → admin approves/rejects (emailed
  either way) → once approved, lists cars with photos + insurance details
  → each new/edited listing needs admin approval before going public →
  receives an email when a buyer requests a test ride, and confirms or
  rejects it directly from the Seller Dashboard (buyer is emailed the
  outcome) → also tracks reviews on their cars
- **Admin**: approves/rejects sellers, approves/rejects car listings, can
  also list cars directly (published instantly), manages insurance plans,
  issues or rejects insurance policies (policy number, document upload,
  validity date), and has override authority to confirm/reject any
  test-ride booking (sellers handle their own by default) — all of these
  email the affected buyer/seller

## Backend setup
```bash
cd backend
cp .env.example .env
```
Edit `.env`:
```
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/rpcarshowroom
CLIENT_ORIGIN=http://localhost:4200
JWT_SECRET=some_long_random_string
ADMIN_EMAIL=admin@rpcarshowroom.com

# SMTP — needed for real emails; without it, emails just log to the console
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="RP Car Showroom <your_email@gmail.com>"

# Razorpay — needed for real payments; without it, payment buttons show a
# clear "not configured" error instead of crashing the server. Get test
# keys from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

Install and run:
```bash
npm install
node seed.js     # admin + approved demo seller + 3 sample cars + 3 insurance plans
npm run dev       # http://localhost:5001
```

Seeded logins:
- **Admin:** `admin@rpcarshowroom.com` / `admin123`
- **Demo seller (pre-approved):** `seller@rpcarshowroom.com` / `seller123`

### Gmail SMTP note
Use an **App Password**, not your normal Gmail password (Google account →
Security → 2-Step Verification → App Passwords). Regular passwords won't
authenticate.

### API overview
| Resource | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, me, apply-seller, admin seller approval |
| Cars | `/api/cars` | public browse+filters, seller/admin create+edit, admin approval queue |
| Bookings | `/api/bookings` | buyer requests, seller confirms/rejects their own (admin can too) — emails buyer |
| Policies | `/api/policies` | insurance, terms, privacy, cancellation content |
| Insurance Plans | `/api/insurance-plans` | public listing + premium calculator, admin CRUD |
| Insurance Requests | `/api/insurance-requests` | buyer requests a quote, admin issues/rejects (emails buyer) |
| Reviews | `/api/reviews` | buyer creates (one per car), public per-car listing, seller's own feed |
| Payments | `/api/payments` | Razorpay order creation + verification for booking deposits and insurance premiums |
| Notifications | `/api/notifications` | in-app alerts — list, unread count, mark read/all-read |
| Wishlist | `/api/wishlist` | buyer saves/removes cars, one entry per user per car |

All protected routes expect `Authorization: Bearer <token>`.
Uploaded images/documents are served from `/uploads/<filename>`.

## Frontend setup
```bash
cd frontend
npm install
npm start          # http://localhost:4200 (or whatever port ng serve picks)
```

`src/environments/environment.ts` points `apiUrl` at
`http://localhost:5001/api` — update if your backend runs elsewhere.
**Important:** the backend's `CLIENT_ORIGIN` must exactly match whatever
port the frontend actually runs on, or requests will be blocked by CORS.

### Pages
- **Public:** Home, Browse Cars (search + filters), Car Detail (gallery,
  insurance details, seller info, reviews, test-ride booking, insurance
  quote request), Policies
- **Buyer (logged in):** My Bookings, My Insurance, Sell Your Car (seller
  application)
- **Seller (approved):** Dashboard, Add Car (insurance fields + multi-photo
  upload), My Listings, Test Ride Requests, My Reviews
- **Admin:** Dashboard, Pending Sellers, Pending Listings, Add Car (direct
  publish), Manage Cars, Test Ride Bookings, Insurance Plans, Insurance
  Requests

Mobile-responsive throughout — the navbar collapses into a hamburger menu
below 860px, and all grids/forms reflow for small screens.

## Payments (Razorpay)

Two payment moments, both buyer-initiated once the relevant record reaches
the right status:
- **Test-ride deposit** — once a seller/admin confirms a booking, the buyer
  sees a "Pay Deposit" button on My Bookings (default ₹500, refundable —
  refund handling is manual for now, not automated).
- **Insurance premium** — once admin issues a policy, the buyer sees a
  "Pay Premium" button on My Insurance for the final premium amount.

Payment verification happens server-side (HMAC signature check against
`RAZORPAY_KEY_SECRET`) — the frontend never marks something as paid on its
own. Without Razorpay keys configured, the pay buttons will show a clear
"not configured" error rather than the server crashing.

## Notifications

A bell icon in the navbar (visible when logged in) shows an unread-count
badge and a dropdown of recent alerts. The frontend polls for the unread
count every 30 seconds. Events that create a notification:
- New test-ride request → seller
- Booking confirmed/rejected → buyer
- New insurance quote request → all admins
- Policy issued/rejected → buyer
- New seller application → all admins
- Seller approved/rejected → seller
- New car listing pending review → all admins
- Listing approved/rejected → seller
- Payment successful → buyer
- New review left → seller

Clicking a notification marks it read and navigates to the relevant page.
These are in-app only — the existing email notifications for these same
events are unchanged and still send separately.

## Wishlist

A heart-toggle button on Browse Cars and Car Detail lets buyers save/remove
cars instantly (optimistic UI update, reverts if the request fails). My
Wishlist lists everything saved. State is a single shared signal
(`WishlistService.carIds`) loaded on login and cleared on logout, so the
heart icon reflects the same saved state everywhere without re-fetching per
page.

## Password Reset

"Forgot password?" on the login page → email → new password. The reset
token is a random 32-byte value; only its SHA-256 hash is stored in the
database (the raw token never touches the DB, only the emailed link), and
it expires after 1 hour. The forgot-password endpoint always returns the
same generic message regardless of whether the email exists, to avoid
leaking which emails are registered.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide — Vercel
(frontend) + Render (backend) + MongoDB Atlas (database).

## Not yet built (natural next steps)
- Password reset flow
- In-app notifications (currently email-only)
- Pagination on browse/admin tables
- Online premium payment (currently: request → admin issues → buyer pays offline)
- Real insurance-partner API integration (currently: admin manually issues
  policies through the panel, not connected to an actual insurer's system)
- Production environment file + deployment config
