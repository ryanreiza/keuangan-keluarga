# Harga Emas Otomatis

Tambahkan pembaruan otomatis harga spot emas IDR per gram untuk halaman Tabungan Emas.

## Perubahan
- Gunakan sumber harga eksternal tanpa kunci API, dipanggil dari fungsi server agar aplikasi memvalidasi dan menyimpan hasil untuk pengguna yang masuk.
- Perbarui harga saat halaman emas dibuka bila kutipan tersimpan sudah berumur satu hari, dan sediakan tombol pembaruan manual.
- Simpan waktu pembaruan terakhir; tampilkan sumber dan waktu tersebut serta pertahankan harga terakhir bila sumber gagal.
- Tetap pertahankan pengisian harga manual sebagai pilihan/fallback.

## Detail teknis
- Gunakan endpoint XAU/IDR per gram; validasi status, currency, unit, nilai positif dan timestamp sebelum menyimpan.
- Tambahkan kolom waktu pembaruan harga pada profil dan fungsi Edge yang memvalidasi sesi pengguna sebelum update.
- Harga spot adalah nilai acuan pasar, bukan harga jual/beli ritel atau buyback; pembaruan otomatis berjalan saat pengguna membuka halaman, bukan saat aplikasi tidak digunakan.
