
# Pendapat Tampilan & Rencana Redesign Profesional

## Pendapat Singkat

Tampilan saat ini sudah **rapi dan fungsional**, tapi belum terasa "kelas profesional" seperti aplikasi keuangan modern (Jenius, Jago, Mint, YNAB). Beberapa kelemahan visual yang terlihat:

- **Halaman Auth** terlalu polos — card mengambang di tengah dengan banyak ruang kosong, tanpa branding/visual pendukung. Tidak terasa seperti produk fintech.
- **Palet warna** didominasi biru navy yang flat. Tidak ada accent color yang membuat data finansial "hidup" (hijau pemasukan, merah pengeluaran terlihat soft). Background putih polos terasa datar.
- **Sidebar** terlalu padat — setiap menu punya 2 baris (judul + deskripsi) sehingga panjang dan ramai. Aplikasi fintech profesional biasanya sidebar minimalis 1 baris.
- **Stat cards** di Dashboard pakai persentase perubahan **hardcoded** (+8.5%, -2.1%) yang tidak nyata — terlihat sebagai mock, mengurangi kredibilitas.
- **Tipografi** menggunakan default sans-serif (kemungkinan system font). Web keuangan profesional pakai font seperti **Inter, Plus Jakarta Sans, atau Geist** dengan tabular numerals untuk angka.
- **Tidak ada visualisasi data ringkas** di hero dashboard (sparkline, mini chart) — semua angka mentah.
- **Spacing & shadow** kurang konsisten — beberapa card pakai `shadow-card` lemah, beberapa tanpa border, terkesan "flat" bukan "premium".
- **Empty state, loading state, dan ikon** generik — tidak ada karakter brand.

## Yang Akan Diubah

### 1. Design System Refresh (`index.css` + `tailwind.config.ts`)
- **Font profesional**: Tambahkan **Plus Jakarta Sans** (untuk teks) + **JetBrains Mono / tabular-nums** untuk angka uang. Load dari Google Fonts di `index.html`.
- **Palet warna lebih hidup**:
  - Primary: ubah dari navy gelap kaku (`217 91% 25%`) → biru lebih segar & premium (`221 83% 53%` atau gradien biru-ungu).
  - Tambah accent color (mint/teal) untuk highlight CTA sekunder.
  - Success/danger lebih saturated untuk badge transaksi.
- **Background**: Ganti putih polos jadi `bg-gradient-surface` halus + grid/dot pattern subtle untuk kesan premium.
- **Shadow**: Buat shadow lebih lembut tapi berdimensi (multi-layer) untuk kesan elevated card.
- **Radius**: Naikkan radius card dari 0.75rem → 1rem untuk look modern.

### 2. Halaman Auth (Login/Daftar) — Redesign Total
- **Layout split-screen 2 kolom** (desktop):
  - Kiri: form login (clean, fokus).
  - Kanan: panel branded dengan ilustrasi/mockup dashboard, tagline ("Kelola keuangan keluarga lebih cerdas"), 3 bullet benefit (real-time sync, multi-rekening, laporan otomatis).
- Mobile: tetap single column, tapi tambah hero section di atas form.
- Logo + brand name lebih besar, dengan tagline.
- Tombol Login pakai gradient primary + micro-interaction (hover lift).

### 3. Sidebar — Lebih Minimalis & Premium
- Hilangkan deskripsi menu (1 baris saja: ikon + judul).
- Group menu jadi 2 sections: **Overview** (Dashboard, Tahunan, Laporan) dan **Manajemen** (Transaksi, Rekening, Kategori, Tabungan, Utang).
- "Total Saldo" card di footer: ganti background flat jadi card glassmorphism/gradient yang lebih halus, tambah label "Saldo gabungan semua rekening" + ikon mata untuk hide/show angka (privacy).
- User info: tambah avatar dengan initial nama (bukan ikon User generik).

### 4. Dashboard — Lebih Insightful
- **Stat cards**: hapus persentase hardcoded; ganti dengan **perbandingan vs bulan lalu yang dihitung real** (jika tidak ada data, jangan tampilkan baris perubahan).
- Tambah **mini sparkline** di setiap stat card (tren 6 bulan terakhir) pakai recharts.
- Header dashboard: tambah greeting dinamis ("Selamat pagi, [Nama]") + tanggal hari ini.
- "Aksi Cepat" diberi ikon berwarna (bg circle gradient), bukan outline polos.

### 5. Tabel Transaksi & List — Polish
- Row hover state lebih halus (subtle bg + shift kiri kecil).
- Amount pakai `font-mono tabular-nums` agar angka lurus.
- Badge tipe transaksi (income/expense) pakai pill berwarna soft (bg-success/10 text-success).
- Ikon kategori dalam lingkaran berwarna (bukan teks polos).

### 6. Empty States Konsisten
- Buat komponen `<EmptyState icon title description action />` reusable, pakai ilustrasi sederhana (lucide icon dalam circle gradient) — diterapkan di Transactions, Savings, Debts, Reports kosong.

### 7. Header / Topbar
- Tambah search global (cari transaksi cepat) di header.
- Notifikasi bell dengan badge count.
- Avatar dropdown untuk profile/settings/logout (lebih konvensional daripada logout di sidebar).

## Rincian Teknis

**File yang akan diubah:**
- `index.html` — load Google Fonts (Plus Jakarta Sans, JetBrains Mono).
- `tailwind.config.ts` — daftarkan fontFamily `sans` & `mono`, tambah util `tabular-nums`.
- `src/index.css` — refresh CSS variables (primary, gradient, shadow, radius), tambah pattern background utility.
- `src/pages/Auth.tsx` — split-screen layout dengan brand panel.
- `src/components/FinancialSidebar.tsx` — simplifikasi item, group sections, avatar inisial, balance card baru dengan show/hide.
- `src/components/layout/DashboardLayout.tsx` — header baru (greeting, search, notifikasi, avatar dropdown).
- `src/pages/Dashboard.tsx` — greeting dinamis, sparkline di stat cards, hapus persentase hardcoded, quick actions berwarna.
- `src/components/EmptyState.tsx` (baru) — komponen reusable.
- `src/pages/Transactions.tsx` — apply badge & font-mono amount, ikon kategori berwarna.

**Tidak diubah:** Logika bisnis, hooks Supabase, struktur routing, fitur backend — purely visual upgrade.

## Prioritas (Bisa Bertahap)

| Prioritas | Item | Impact |
|---|---|---|
| Tinggi | Design tokens (font, warna, shadow) | Look & feel keseluruhan langsung naik |
| Tinggi | Redesign Auth split-screen | First impression user |
| Tinggi | Sidebar simplifikasi + balance card baru | Navigasi inti terlihat tiap halaman |
| Sedang | Dashboard sparkline + greeting + hapus angka palsu | Kredibilitas |
| Sedang | Header dengan search + notif + avatar | Konvensi UX modern |
| Rendah | Empty states reusable | Konsistensi |
| Rendah | Polish tabel transaksi | Detail kerapian |

Setelah disetujui, saya akan implementasikan **semua item di atas** dalam satu kali eksekusi (urut dari design tokens → komponen umum → halaman).
