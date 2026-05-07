# Penilaian Tampilan Saat Ini

**Sudah baik:**
- Design tokens HSL lengkap (primary/success/danger/warning + gradients).
- Sidebar gelap, Plus Jakarta Sans, font-mono untuk angka, glass utility.
- Halaman Auth split-screen sudah modern.

**Yang membuat terlihat "biasa" (belum premium):**
1. **Hierarki visual dashboard kurang tegas** — semua kartu pakai shadow-card yang sama, tidak ada hero/headline angka utama yang dominan. Mata pengguna tidak tahu mana yang penting.
2. **Kartu statistik flat** — 4 kotak sejajar dengan icon kecil di kanan, gaya generik (mirip template admin). Fintech premium (Revolut, Wise, Mercury) memakai 1 hero balance besar + secondary metrics.
3. **Tipografi angka kurang dramatis** — nominal Rupiah masih `text-2xl font-bold`, tidak menonjol. Brand fintech selalu pakai display besar (text-4xl/5xl) dengan tracking ketat untuk angka utama.
4. **Spacing mobile terlalu rapat** — padding card 16px, header 3xl di mobile bikin overflow, tombol "Tambah Transaksi" panjang menabrak select bulan.
5. **Konsistensi border/shadow tidak ketat** — campuran `border-0`, `border border-border/50`, `shadow-card`, `shadow-md` di halaman berbeda.
6. **Tab Login/Daftar di Auth** terlalu menempel dengan card; gradient kanan terlalu gelap dan kontrasnya kasar.
7. **Tidak ada empty state ilustratif** — saat user baru, halaman terasa kosong dan murah.
8. **Tablet (768–1024px) tidak dioptimasi** — grid loncat dari 1 kolom ke 4 kolom tanpa breakpoint `md:` yang halus, kartu jadi sempit dan teks terpotong.
9. **Header tiap halaman tidak konsisten** — beberapa pakai gradient icon, beberapa polos; ukuran title bervariasi (text-2xl vs text-3xl).
10. **Tidak ada microinteraction** di hover stat cards — terasa statis.

---

# Rencana Perbaikan (3 Fase)

## Fase 1 — Foundation Polish (paling berdampak)

**A. Tipografi angka & display**
- Tambah utility `.text-display-1` (text-4xl md:text-5xl, tracking-tight, font-display) untuk hero balance.
- `.text-display-2` (text-3xl md:text-4xl) untuk metric utama.
- Wajibkan `font-mono-num` di setiap nominal Rupiah.
- Tambah `.text-eyebrow` (text-xs uppercase tracking-widest text-muted-foreground) untuk label di atas angka.

**B. Standarisasi card system**
- Hapus campuran `border-0`. Satu standar: `bg-card border border-border/60 shadow-sm rounded-2xl`.
- Variant `card-hero` (gradient mesh + shadow-elegant) untuk kartu utama.
- Variant `card-metric` (subtle, hover-lift) untuk stat.
- Variant `card-glass` untuk overlay.

**C. Spacing & container**
- Ganti `space-y-6` → `space-y-6 md:space-y-8` di semua halaman utama.
- Tambah `max-w-[1440px] mx-auto` di DashboardLayout content agar tidak melebar di monitor besar.
- Padding card responsif: `p-4 md:p-6`.

## Fase 2 — Halaman Kunci Redesign

**D. Auth page**
- Lembutkan gradient kanan (kurangi opacity navy ke 70%, tambah noise/grain halus).
- Mockup mini "kartu balance" floating di panel kanan untuk product preview.
- Tab Login/Daftar diberi background muted dengan indicator slide animasi.
- Logo dengan glow halus, tagline lebih besar.

**E. Dashboard**
- Hero section baru: 1 kartu lebar (col-span-2 md:col-span-4) "Total Saldo" — angka sangat besar, sparkline tipis 30 hari di belakang, badge perubahan, action chips (Transfer, Tambah).
- 3 metric cards di bawah: Pemasukan, Pengeluaran, Tabungan — lebih ringkas, icon dalam circle gradient.
- Section "Cash Flow" pakai area chart lebih tinggi (h-72 md:h-80) dengan gradient fill yang halus.
- Quick stats: Akun aktif, Goal progress, Utang aktif — sebagai compact list, bukan card besar.

**F. Konsistensi page header**
- Komponen `<PageHeader icon title subtitle actions />` dipakai di semua halaman: ikon dalam square gradient 40px, title `text-2xl md:text-3xl font-display`, subtitle muted, actions di kanan dengan gap konsisten.

## Fase 3 — Responsif & Detail Premium

**G. Mobile (< 640px)**
- Hero balance turun jadi 1 kolom penuh, angka text-4xl.
- Action buttons jadi icon-only di mobile (label di tooltip).
- Bottom nav tetap, tapi tambah safe-area & blur backdrop.
- Header sticky dengan glass effect saat scroll.

**H. Tablet (768–1024px)**
- Grid stats: `grid-cols-2 lg:grid-cols-4` (bukan langsung 1→4).
- Sidebar jadi rail icon-only mode (collapse otomatis).
- Charts split 2 kolom di tablet landscape.

**I. Microinteractions**
- Stat cards: hover-lift + border-color shift ke primary/30.
- Number rolling animation saat data berubah (framer-motion `animate` dari 0 ke value, durasi 600ms).
- Skeleton loaders pengganti spinner Loader2 polos.
- Page transitions sudah ada; tambah stagger di stat grid.

**J. Detail premium**
- Empty state: ilustrasi SVG inline minimal (bukan hanya icon Lucide) + CTA primer.
- Status pill konsisten: rounded-full px-2.5 py-0.5 text-xs font-medium dengan bg-{status}-bg dan text-{status}.
- Footer kecil di Auth & Dashboard (versi, status sistem).
- Favicon & meta theme-color disesuaikan dengan brand primary.

---

# File yang Akan Dimodifikasi

```text
src/index.css                       — utility tipografi, card variants, container
tailwind.config.ts                  — screen breakpoints, container max-width
src/components/layout/DashboardLayout.tsx  — max-width, sticky header glass
src/components/PageHeader.tsx       — komponen baru, dipakai semua page
src/pages/Auth.tsx                  — gradient halus, preview card, tabs
src/pages/Dashboard.tsx             — hero balance, metric ringkas, chart polish
src/pages/Transactions.tsx          — terapkan PageHeader + card standar
src/pages/Savings.tsx               — idem
src/pages/Debts.tsx                 — idem
src/pages/Reports.tsx & Monthly.tsx & Annual.tsx — idem + spacing
src/components/MobileBottomNav.tsx  — glass backdrop, safe area
src/components/EmptyState.tsx       — ilustrasi SVG
src/components/ui/card.tsx          — varian (hero/metric/glass)
src/components/StaggerItem.tsx      — number rolling helper
```

# Catatan Teknis

- Semua warna lewat token HSL existing — tidak ada hex baru di komponen.
- Animasi pakai framer-motion yang sudah ada di project.
- Tidak menambah dependency baru.
- Tetap dark/light mode aware.

Setelah disetujui, saya akan kerjakan Fase 1 dulu (foundation) lalu lanjut Fase 2 & 3 dalam batch yang sama supaya tampilan langsung berubah signifikan tanpa banyak iterasi.
