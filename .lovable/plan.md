# Perbaikan Akurasi Progress Pelunasan Utang

## Penyebab

Pada tabel `transactions` terdapat **dua pasang trigger duplikat** yang menjalankan fungsi yang sama setiap kali transaksi pembayaran utang dibuat atau dihapus:

INSERT (mengurangi `remaining_amount`):
- `trigger_update_debt_on_payment` → `update_debt_on_payment()`
- `update_debt_on_transaction_insert` → `update_debt_on_payment()` *(duplikat)*

DELETE (mengembalikan `remaining_amount`):
- `trigger_reverse_debt_payment` → `reverse_debt_payment()`
- `reverse_debt_on_transaction_delete` → `reverse_debt_payment()` *(duplikat)*

Karena keduanya aktif, setiap pembayaran utang Rp 500.000 dipotong dua kali sehingga progress di "Daftar Utang Aktif" tercatat Rp 1.000.000. Ini menjelaskan kenapa semua utang aktif terdampak.

## Perbaikan

Buat migration yang menghapus trigger duplikat (menyimpan satu trigger untuk INSERT dan satu untuk DELETE), lalu jalankan koreksi data untuk utang yang sudah terlanjur terpotong ganda.

### Langkah 1 — Drop trigger duplikat
```sql
DROP TRIGGER IF EXISTS update_debt_on_transaction_insert ON public.transactions;
DROP TRIGGER IF EXISTS reverse_debt_on_transaction_delete ON public.transactions;
```

### Langkah 2 — Rekonsiliasi data utang yang sudah ada
Hitung ulang `remaining_amount` semua utang dari `total_amount` dikurangi total pembayaran riil pada `transactions` (yang memiliki `debt_id`), lalu perbarui status `is_paid_off`.

```sql
UPDATE public.debts d
SET
  remaining_amount = d.total_amount - COALESCE(p.paid, 0),
  is_paid_off = (d.total_amount - COALESCE(p.paid, 0)) <= 0,
  updated_at = now()
FROM (
  SELECT debt_id, SUM(amount) AS paid
  FROM public.transactions
  WHERE debt_id IS NOT NULL
  GROUP BY debt_id
) p
WHERE p.debt_id = d.id;
```

## Verifikasi
- Tambahkan pembayaran utang baru Rp 500.000 → progress hanya berkurang Rp 500.000.
- Hapus transaksi pembayaran → progress kembali bertambah Rp 500.000 (satu kali).
- Daftar utang aktif yang sebelumnya salah akan menampilkan sisa utang yang benar setelah migration dijalankan.

## File yang tersentuh
Hanya migration database baru. Tidak ada perubahan kode frontend.
