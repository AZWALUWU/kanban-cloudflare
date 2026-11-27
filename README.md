# TaskFlow

TaskFlow adalah papan Kanban sederhana untuk mengatur pekerjaan pribadi atau proyek kecil. Buat board, susun tugas di To Do, In Progress, dan Done, lalu bagikan board dengan anggota yang sudah terdaftar.

<p align="center">
  <a href="https://kanban-board-5ka.pages.dev"><strong>Buka TaskFlow</strong></a> ·
  <a href="https://github.com/AZWALUWU/kanban-cloudflare/issues">Laporkan masalah</a>
</p>

## Screenshot

![TaskFlow board dengan kolom To Do, In Progress, dan Done](docs/screenshots/board.png)

Halaman login: [lihat screenshot](docs/screenshots/auth.png).

## Fitur

- Buat beberapa board dan pilih board yang ingin dikerjakan.
- Tambah, edit, dan hapus tugas.
- Pindahkan dan urutkan kartu dengan drag-and-drop.
- Tulis deskripsi Markdown, pilih prioritas Low, Medium, atau High, isi tenggat, dan buat checklist.
- Cari tugas berdasarkan judul dan filter berdasarkan prioritas.
- Owner dapat menambahkan anggota memakai email akun yang sudah terdaftar. Undangan ke pengguna yang belum mendaftar belum tersedia.
- Perubahan urutan kartu langsung terlihat, lalu disimpan melalui API.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| UI | React, TypeScript, Vite, Tailwind CSS |
| Drag-and-drop | `@hello-pangea/dnd` |
| API | Hono pada Cloudflare Pages Functions, Zod |
| Database | Cloudflare D1, Drizzle ORM |
| Sesi | JWT dalam cookie `httpOnly`, daftar sesi di Workers KV |
| Password | Web Crypto API, PBKDF2-SHA256 |
| Hosting | Cloudflare Pages |

## Jalankan lokal

Prasyarat: Node.js 20+ dan npm.

```bash
git clone https://github.com/AZWALUWU/kanban-cloudflare.git
cd kanban-cloudflare
npm install
npm run build
npm run pages:dev
```

Buka [http://localhost:8788](http://localhost:8788) dan buat akun. Pages Functions memakai binding yang didefinisikan di `wrangler.toml`. Untuk menjalankan secara lokal, siapkan `JWT_SECRET` di `.dev.vars`. Jangan commit file tersebut.

Perintah pemeriksaan:

```bash
npm test
npm run lint
```

## Deploy

Proyek live: [kanban-board-5ka.pages.dev](https://kanban-board-5ka.pages.dev). Untuk membuat deployment sendiri, siapkan Cloudflare Pages, D1, KV, lalu sesuaikan binding pada `wrangler.toml`.

Atur secret autentikasi untuk project Pages:

```bash
npx wrangler pages secret put JWT_SECRET --project-name NAMA_PROJECT
```

Gunakan secret acak yang kuat. Jangan masukkan nilainya ke Git atau README. Migrasi `migrations/0001_workspaces.sql` menginisialisasi skema workspace dan menghapus tabel tugas lama; gunakan hanya bila memang ingin memulai dengan data tugas kosong.

## API

Semua route memakai prefix `/api`. Route board memerlukan sesi aktif dan verifikasi keanggotaan board.

| Method | Path | Kegunaan |
| --- | --- | --- |
| POST | `/auth/register` | Buat akun dan board awal |
| POST | `/auth/login` | Masuk |
| POST | `/auth/logout` | Keluar dan cabut sesi KV |
| GET | `/auth/me` | Periksa sesi |
| GET, POST | `/boards` | Daftar atau buat board |
| GET | `/boards/:boardId/tasks` | Daftar tugas board |
| POST | `/boards/:boardId/tasks` | Buat tugas |
| PUT, DELETE | `/boards/:boardId/tasks/:id` | Edit atau hapus tugas |
| PATCH | `/boards/:boardId/tasks/reorder` | Pindah atau urutkan satu kartu |
| POST | `/boards/:boardId/invites` | Tambahkan pengguna terdaftar |
| GET | `/boards/:boardId/members` | Daftar anggota |
| DELETE | `/boards/:boardId/members/:memberId` | Hapus anggota sebagai Owner |

## Catatan

Ini proyek showcase. Alur utama API diuji setelah deploy; interaksi drag-and-drop dan tampilan belum diuji menyeluruh di browser. Undangan email hanya menerima akun yang sudah terdaftar.

## Lisensi

Lisensi belum ditetapkan. Minta izin pemilik repository sebelum menggunakan atau mendistribusikan ulang kode.
