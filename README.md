# PaperTech Backend

Backend for the PaperTech Paper Trading & Inventory Management System.

## Setup

1. Copy `.env.example` to `.env` and configure your database credentials.
2. Create the database and tables:
   - Use `backend/db/schema.sql` to create the schema.
   - Use `backend/db/sample-data.sql` to insert sample admin and products.
3. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/products`
- `POST /api/products`
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/reports/dashboard`
- `GET /api/ledger/:customer_id`

## Notes

- Uses raw SQL via `mysql2`.
- Uses JWT authentication and role-based access control.
- Admin may register new users by calling `/api/auth/register`.
