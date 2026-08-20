# Sinkronisasi Target Bulanan ke Ringkasan Pengeluaran Bulanan

Angka **Yang Diharapkan** pada Ringkasan Pengeluaran Bulanan akan terisi otomatis dari baris-baris di menu Target Keuangan Bulanan yang sudah dipilih **Kategori Web**-nya.

## Cara kerja

- Sumber angka: **Pengeluaran Tetap Sebelum Target** + **Target Alokasi Keuangan**, untuk bulan & tahun yang sama.
- Semua baris dengan Kategori Web yang sama dijumlahkan menjadi satu angka per kategori.
  - Pengeluaran Tetap: pakai kolom Jumlah.
  - Target Alokasi: pakai jumlah hasil hitungan (persentase x sisa keuangan).
- Baris tanpa Kategori Web diabaikan.

## Perilaku isi otomatis (manual bisa menimpa)

- Jika baris kategori belum pernah diisi manual, nilainya mengikuti Target Bulanan dan diberi label kecil **Otomatis**.
- Jika pengguna mengetik angka sendiri, nilai manual disimpan dan dipertahankan (label berubah jadi **Manual**), walau Target Bulanan berubah.
- Pada baris manual muncul aksi kecil **Pakai otomatis** untuk mengembalikan ke nilai dari Target Bulanan.
- Kategori yang tidak punya sumber di Target Bulanan tetap diisi manual seperti sekarang.
- Ditambahkan keterangan di header kartu: sumber angka berasal dari Target Keuangan Bulanan.

## Catatan teknis

- `MonthlyBudgetTracker.tsx` menerima data rencana bulan aktif lewat `useMonthlyPlan(month, year)` dan membangun map `web_category_id -> total`.
- Nilai otomatis disimpan ke tabel `monthly_budgets` (lewat `upsertBudget`) agar progress bar, grafik, dan notifikasi anggaran tetap konsisten; penyimpanan hanya dilakukan saat nilai otomatis berbeda dari yang tersimpan dan baris belum ditandai manual.
- Penanda manual disimpan di kolom baru `is_manual` (boolean, default false) pada `monthly_budgets` — perlu satu migrasi kecil. Alternatif tanpa migrasi tidak dipakai supaya status manual ikut tersinkron antar perangkat.
- Baris Tujuan Tabungan (savings goals) tetap manual, kecuali Kategori Web yang dipilih di Target Bulanan memang kategori bertipe savings — dalam hal ini tetap dipetakan sebagai baris kategori.
- Tidak ada perubahan pada halaman Target Keuangan Bulanan.
