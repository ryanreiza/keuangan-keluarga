# Target Keuangan Bulanan — Rencana Implementasi

Menu baru yang terpisah dari Transaksi, untuk merencanakan alokasi uang bulanan (pemasukan, pengeluaran tetap, dan target alokasi berbasis persentase).

## Navigasi
- Tambah item **"Target Bulanan"** di sidebar (`FinancialSidebar.tsx`) + `MobileBottomNav`, ikon `Target` / `Wallet`, route `/monthly-plan`.
- Register di `App.tsx` (lazy load `MonthlyPlan.tsx`).

## Halaman `/monthly-plan`
Header: judul **"TARGET KEUANGAN BULANAN"** + month/year picker (default bulan berjalan). Semua data tersimpan per (user, month, year).

### Seksi 1 — Pemasukan Utama
Tabel: `Kategori` | `Jumlah (IDR)` | aksi hapus.
- Tombol "Tambah Baris", edit inline, footer **Total Pemasukan** (auto).

### Seksi 2 — Pengeluaran Tetap Sebelum Target
Tabel: `Kategori` | `Jumlah` | `Kategori Web` (dropdown dari `categories` tipe expense) | `Remark`.
- Footer **Total Pengeluaran Tetap** (auto).

### Kartu Ringkasan — Sisa Keuangan Bulanan
`Total Pemasukan − Total Pengeluaran Tetap`, highlight hijau (merah bila negatif).

### Seksi 3 — Target Alokasi Keuangan
Tabel: `Persentase (%)` | `Kategori` | `Jumlah` (auto `= % × Sisa`) | `Keterangan` | `Kategori Web` (dropdown) | `Remark`.
- Tombol "Tambah Baris" (18 kategori default tersedia sebagai template awal).
- Validasi total persentase = 100% (banner peringatan bila tidak).
- Kolom **Realisasi** & **Sisa** dihitung dari `transactions` bulan berjalan yang cocok dengan `Kategori Web` (tipe expense). Badge status otomatis: hijau (≤80%), kuning (80–100%), merah (>100%).

## Database (1 migrasi)
Tiga tabel baru — semua RLS per `user_id` + GRANT `authenticated`/`service_role`:

1. `monthly_plan_incomes` — `id, user_id, month, year, category, amount, sort_order, created_at, updated_at`
2. `monthly_plan_fixed_expenses` — `id, user_id, month, year, category, amount, web_category_id (fk categories nullable), remark, sort_order, timestamps`
3. `monthly_plan_allocations` — `id, user_id, month, year, percentage, category, note, web_category_id (fk categories nullable), remark, sort_order, timestamps`

Index gabungan `(user_id, year, month)` pada tiap tabel. Trigger `update_updated_at_column` diikat ke ketiga tabel.

## Kode Frontend
- `src/hooks/useMonthlyPlan.ts` — fetch/CRUD tiga tabel (satu hook, tiga koleksi) + realtime opsional.
- `src/pages/MonthlyPlan.tsx` — layout page + month picker.
- `src/components/monthly-plan/IncomeSection.tsx`, `FixedExpenseSection.tsx`, `AllocationSection.tsx`, `RemainingSummaryCard.tsx`.
- Realisasi memakai `useTransactions` (filter bulan + `category_id`).
- Format IDR via `Intl.NumberFormat('id-ID')`, input angka numeric-only, tidak boleh negatif.

## Non-Goals
- Tidak mengubah menu Transaksi, Kategori, atau Ringkasan Pengeluaran Bulanan yang lama.
- Tidak menambah tipe transaksi baru; hanya membaca `transactions` untuk realisasi.
