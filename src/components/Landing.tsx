interface LandingProps {
  onOpenApp: () => void
}

const features = [
  ['Boards terpisah', 'Pisahkan tugas kuliah, proyek, atau pekerjaan pribadi dalam board masing-masing.'],
  ['Drag-and-drop', 'Pindahkan kartu antara To Do, In Progress, dan Done, lalu atur urutannya.'],
  ['Detail tugas', 'Tambahkan deskripsi Markdown, prioritas, tenggat, dan checklist.'],
  ['Cari dan filter', 'Temukan tugas lewat judul atau saring berdasarkan prioritas.'],
  ['Kolaborasi board', 'Owner dapat menambahkan pengguna terdaftar sebagai Member.'],
]

export function Landing({ onOpenApp }: LandingProps) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <nav aria-label="Navigasi utama" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#home" className="text-xl font-bold tracking-tight text-slate-900">TaskFlow</a>
        <div className="flex items-center gap-5">
          <a href="#fitur" className="hidden min-h-11 items-center text-sm font-medium text-slate-700 hover:text-blue-800 sm:flex">Fitur</a>
          <button type="button" onClick={onOpenApp} className="min-h-11 rounded-md bg-blue-800 px-4 text-sm font-semibold text-white transition hover:bg-blue-900 active:bg-blue-950">Buka aplikasi</button>
        </div>
      </nav>
    </header>

    <main id="home">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="mb-4 text-sm font-semibold text-blue-800">Papan Kanban untuk proyek kecil</p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Atur tugas. Lihat progres. Tetap sederhana.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-700">Kelola pekerjaan pribadi atau proyek tim dalam board yang mudah dipahami. TaskFlow gratis digunakan.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onOpenApp} className="min-h-12 rounded-md bg-blue-800 px-5 font-semibold text-white transition hover:bg-blue-900 active:bg-blue-950">Mulai gunakan TaskFlow</button>
            <a href="#fitur" className="inline-flex min-h-12 items-center rounded-md border border-slate-300 bg-white px-5 font-semibold text-slate-800 hover:bg-slate-100">Lihat fitur</a>
          </div>
          <p className="mt-4 text-sm text-slate-600">Gratis 100%. Buat akun untuk mulai mengelola tugas.</p>
        </div>
        <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img src="/screenshots/board.png" alt="Tampilan TaskFlow dengan board dan kolom tugas To Do, In Progress, dan Done" width="1440" height="900" fetchPriority="high" className="block h-auto w-full" />
          <figcaption className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Board tugas TaskFlow</figcaption>
        </figure>
      </section>

      <section id="fitur" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Semua yang dibutuhkan untuk mengatur tugas</h2>
            <p className="mt-3 leading-7 text-slate-700">Fitur inti untuk menjaga pekerjaan tetap tertata, tanpa alat yang rumit.</p>
          </div>
          <ul className="mt-9 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, description]) => <li key={title} className="border-t-2 border-blue-800 pt-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-6 text-slate-700">{description}</p>
            </li>)}
          </ul>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-slate-600">Catatan kolaborasi: anggota harus sudah memiliki akun TaskFlow. Undangan email untuk pengguna baru belum tersedia.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[1fr_0.8fr]">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mulai dari board kosong</h2>
          <p className="mt-3 max-w-xl leading-7 text-slate-700">Buat board, tambahkan tugas, lalu pindahkan kartu saat pekerjaan berjalan. Akun gratis tersedia langsung dari aplikasi.</p>
          <button type="button" onClick={onOpenApp} className="mt-6 min-h-12 rounded-md bg-blue-800 px-5 font-semibold text-white transition hover:bg-blue-900 active:bg-blue-950">Buat akun gratis</button>
        </div>
        <a href="/screenshots/auth.png" className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Lihat screenshot halaman login TaskFlow">
          <img src="/screenshots/auth.png" alt="Halaman login dan pendaftaran TaskFlow" width="1440" height="900" loading="lazy" className="block h-auto w-full" />
        </a>
      </section>
    </main>

    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-slate-600 sm:px-8">
        <span>TaskFlow. Papan tugas Kanban gratis.</span>
        <a href="https://github.com/AZWALUWU/kanban-cloudflare" className="min-h-11 inline-flex items-center underline underline-offset-4 hover:text-blue-800">Lihat source code di GitHub</a>
      </div>
    </footer>
  </div>
}
