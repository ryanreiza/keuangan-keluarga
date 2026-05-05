
# Integrasi Otomatis Transaksi Menabung ke Pelacak Tabungan

Saat ini, ketika user menabung, mereka harus:
1. Catat transaksi pengeluaran di halaman Transaksi
2. Buka halaman Tabungan, lalu update progress goal secara manual

Akan kita buat menjadi **satu langkah saja**: pilih tipe transaksi "Menabung" → pilih goal tujuan → otomatis tercatat sebagai transaksi & progress goal bertambah.

---

## Perubahan UX

### Di Form Tambah Transaksi
- Tambah opsi tipe baru: **"Menabung"** (di samping Income, Expense, Transfer, Debt Payment)
- Saat dipilih "Menabung", muncul dropdown baru: **"Tujuan Tabungan"** (list dari `savings_goals` yang belum tercapai)
- Field kategori akan otomatis pakai kategori "Tabungan" (auto-create kalau belum ada)
- Dari sisi pencatatan keuangan, transaksi disimpan sebagai `expense` agar saldo rekening berkurang dengan benar (sama pola dengan Debt Payment)

### Di Halaman Pelacak Tabungan
- Progress bar setiap goal akan otomatis bertambah real-time saat transaksi menabung dibuat
- Jika transaksi menabung dihapus → progress otomatis berkurang kembali
- Tetap bisa edit `current_amount` manual untuk koreksi/saldo awal

---

## Detail Teknis

### 1. Database (migration)
Tambah kolom `savings_goal_id uuid NULL` di tabel `transactions` (nullable, mirip pola `debt_id`).

Update RLS INSERT policy `transactions` agar memvalidasi kepemilikan `savings_goal_id` (sama pola dengan `debt_id`).

Buat 2 trigger function (mirip `update_debt_on_payment` & `reverse_debt_payment`):

- `update_savings_on_contribution()` — AFTER INSERT: jika `NEW.savings_goal_id IS NOT NULL`, tambah `current_amount` di `savings_goals`, set `is_achieved = true` jika tercapai.
- `reverse_savings_contribution()` — AFTER DELETE: jika `OLD.savings_goal_id IS NOT NULL`, kurangi `current_amount`, set `is_achieved = false`.

Keduanya `SECURITY DEFINER` + verifikasi kepemilikan goal (sama pola debt).

### 2. Hooks
- `useTransactions.ts`: tambah field `savings_goal_id?: string` di `Transaction` & `CreateTransactionData`; teruskan ke insert/update.
- `useFinancialData.ts`: pada `createTransactionWithRefresh` & `deleteTransactionWithRefresh`, tambah `savingsHook.refetch()` ke `Promise.all` agar UI tabungan langsung sinkron.

### 3. UI — `src/pages/Transactions.tsx`
- Tambah state `savings_goal_id` di `formData`.
- Tambah `useSavings()` untuk ambil daftar goals.
- Tambah opsi Select "Menabung" (`type: 'savings'`).
- Saat tipe = `savings`: render dropdown "Tujuan Tabungan" (filter `!is_achieved`).
- Saat submit: convert `actualType = 'expense'`, auto-pakai kategori "Tabungan" (create jika belum ada via `useCategories.createCategory`), kirim `savings_goal_id`.
- Tampilkan badge "Menabung" di list transaksi jika `savings_goal_id` ada.

### 4. UI — `src/pages/Savings.tsx`
- Tidak banyak berubah. Karena `current_amount` diupdate trigger DB + refetch otomatis, progress akan akurat.
- Tambah info kecil: "Progress diperbarui otomatis dari transaksi Menabung".

### 5. Detail Dialog & Export
- `TransactionDetailDialog.tsx`: tampilkan nama goal jika `savings_goal_id` ada (mirip tampilan debt).
- `excel-export.ts`: opsional, tambah kolom "Tujuan Tabungan".

---

## Edge Cases
- Hapus transaksi menabung → progress goal berkurang otomatis (trigger reverse).
- Goal sudah tercapai (`is_achieved = true`) → disembunyikan dari dropdown saat membuat transaksi baru.
- Tidak mengubah perilaku transaksi lama (kolom nullable, backward-compatible).

Setelah disetujui, saya akan buat migration DB lalu update kode di atas.
