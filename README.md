# Kanban Board (Cloudflare Pages + D1)

Aplikasi manajemen tugas (Kanban Board) full-stack dengan drag-and-drop, autentikasi pengguna (JWT), dan Cloudflare D1 serverless database.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Interaksi Drag-and-Drop**: `@hello-pangea/dnd`
- **Backend API**: Hono on Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Auth**: Web Crypto API (PBKDF2-SHA256) + JWT via httpOnly cookie

## Cara Menjalankan Secara Lokal

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Jalankan migrasi database lokal D1**:
   ```bash
   npm run db:migrate:local
   ```

3. **Build aplikasi & jalankan dengan Wrangler Pages**:
   ```bash
   npm run build
   npm run pages:dev
   ```
   Aplikasi akan berjalan di `http://localhost:8788`.

## Cara Deploy ke Cloudflare (Free Tier)

1. Login ke Cloudflare via CLI:
   ```bash
   npx wrangler login
   ```

2. Buat database D1 di Cloudflare:
   ```bash
   npx wrangler d1 create kanban-db
   ```
   Salin `database_id` yang dihasilkan ke file `wrangler.toml`.

3. Jalankan migrasi ke remote database:
   ```bash
   npm run db:migrate:remote
   ```

4. Deploy ke Cloudflare Pages:
   ```bash
   npm run build
   npx wrangler pages deploy ./dist --project-name=kanban-cloudflare
   ```
