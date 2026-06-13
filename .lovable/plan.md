## Tujuan
Setiap savings goal muncul sebagai baris tersendiri di **Ringkasan Pengeluaran Bulanan**, sehingga user bisa menetapkan target (yang diharapkan) per tujuan tabungan dan melihat jumlah yang sebenarnya ditabung bulan tersebut. Total expected vs actual akhirnya balance.

## Perubahan

### 1. `src/components/MonthlyBudgetTracker.tsx` (mode `type='expense'` saja)
- Tambah prop baru `savingsGoals: SavingsGoal[]` (dilewatkan dari halaman pemanggil).
- Buat daftar gabungan "rows" untuk mode expense:
  - Semua kategori expense (perilaku lama).
  - Plus satu baris virtual per savings goal dengan id sintetis `savings:<goalId>`, label = nama goal, warna khas (mis. emerald), badge kecil "Tabungan".
- **Actual amount** untuk baris savings = jumlah `transactions` di bulan tsb yang `savings_goal_id === goal.id` (terlepas dari kategori, untuk hindari double-count dari kategori "Tabungan").
- **Actual amount** untuk baris kategori expense biasa = perilaku lama, **tetapi tidak menghitung** transaksi yang punya `savings_goal_id` (supaya tidak dobel dengan baris savings).
- **Expected amount** untuk baris savings disimpan via `monthly_budgets` baru — lihat perubahan DB di bawah.
- Total footer otomatis ikut termasuk baris savings.
- Mode `type='income'` tidak berubah.

### 2. Database (migration)
Tabel `monthly_budgets` saat ini punya kolom `category_id` (NOT NULL kemungkinan). Tambahkan dukungan target per savings goal:
- Tambah kolom `savings_goal_id uuid NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE`.
- Longgarkan `category_id` jadi nullable.
- Tambah CHECK: tepat salah satu dari `category_id` / `savings_goal_id` terisi.
- Tambah unique index parsial: `(user_id, savings_goal_id, month, year)` saat `savings_goal_id IS NOT NULL`; biarkan unique existing untuk category tetap berlaku.
- RLS policy existing (`user_id = auth.uid()`) sudah cukup; tidak perlu tambahan.

### 3. `src/hooks/useMonthlyBudgets.ts`
- Perluas tipe `MonthlyBudget` dan fungsi `upsertBudget` agar menerima `{ savings_goal_id?, category_id? }` (salah satu).
- Sesuaikan `onConflict` upsert: jika input `savings_goal_id` → conflict `(user_id, savings_goal_id, month, year)`; jika `category_id` → seperti sekarang.

### 4. Pemanggil `MonthlyBudgetTracker`
Cari semua tempat ia dipakai dan teruskan `savingsGoals` dari `useFinancialData` / `useSavings`. (Halaman Reports / Annual / Dashboard sesuai kebutuhan — akan diperiksa & disesuaikan saat build.)

### 5. Tidak berubah
- Form transaksi (`Transactions.tsx`) tetap menyimpan tx menabung sebagai `type='expense'` + `savings_goal_id`. Trigger DB `update_savings_on_contribution` tetap jalan.
- Kategori auto "Tabungan" tetap dibuat (untuk join nama), tapi tidak lagi muncul sebagai baris terpisah di Ringkasan karena transaksinya sudah "dipindah" ke baris savings goal (dan kalau toh muncul sebagai kategori expense kosong, tidak masalah; opsional disembunyikan jika seluruh tx-nya punya `savings_goal_id`).

## Catatan teknis
- Anti-double-count adalah inti: transaksi savings punya BOTH `category_id` (Tabungan) DAN `savings_goal_id`. Kita pilih `savings_goal_id` sebagai sumber kebenaran untuk baris savings dan kecualikan tx tsb dari aggregasi kategori biasa.
- Progress bar & warna mengikuti aturan expense yang sudah ada.
- Copy/Paste target: ikut menyalin target savings (key disertakan prefix `savings:<id>`).
