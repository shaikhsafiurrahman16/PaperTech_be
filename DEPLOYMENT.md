# PaperTech Deployment

## Database

- Import `db/papertech-live.sql` into MySQL or MariaDB for a full live-ready database dump.
- If you only need fresh schema, use `db/schema.sql` or `db/papertech-full-schema.sql`.
- If you want starter records, `db/sample-data.sql` is available too.

## Backend Environment

Set these variables in `backend/.env` on the live server:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `PORT`
- `DEFAULT_SUPER_ADMIN_USERNAME`
- `DEFAULT_SUPER_ADMIN_PASSWORD`

## Start

```bash
npm install
npm start
```

## Frontend

- Set `VITE_API_URL` to the live backend `/api` URL.
- Build with `npm run build` and deploy the generated frontend output to your host.
