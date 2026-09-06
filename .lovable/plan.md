# Penghapusan Rekening Bank yang Lebih Aman & Jelas

## Tujuan
Penghapusan rekening sudah tersedia (ikon tempat sampah di tiap baris rekening). Rencana ini membuatnya lebih aman dan informatif.

## Perubahan
1. **Cek transaksi sebelum hapus** — saat pengguna menekan hapus, aplikasi memeriksa dulu apakah rekening punya riwayat transaksi.
2. **Dialog konfirmasi adaptif**:
   - Jika tidak ada transaksi: konfirmasi hapus seperti biasa.
   - Jika ada transaksi: tampilkan peringatan bahwa rekening memiliki N transaksi, dan beri pilihan: hapus semua transaksi terkait + rekening, atau batalkan.
3. **Opsi alternatif "Nonaktifkan"** — di dialog yang sama, tawarkan menonaktifkan rekening (tidak muncul di pilihan transaksi baru, riwayat tetap aman) sebagai pengganti hapus.

## Teknis
- Edit `src/pages/Accounts.tsx` (dialog konfirmasi) dan `src/hooks/useAccounts.ts` (fungsi cek jumlah transaksi, delete cascade transaksi bila dikonfirmasi, toggle `is_active`).
- Tanpa perubahan skema database.
