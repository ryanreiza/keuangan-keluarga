# Redesain Isi Dashboard — Bento Mewah

Tema warna tetap Navy + Mint (krim), tipografi diarahkan ke **Sora** (judul & angka) + **Manrope** (teks), susunan isi dashboard diubah ke **Bento Grid** agar terasa seperti produk wealth-management premium.

## Susunan baru (desktop)

```text
+----------------------------------+-------------------+
|  SALDO UTAMA (hero, 2 kolom)     |  ARUS KAS BULAN   |
|  Rp besar + tren 6 bulan         |  Masuk / Keluar   |
|  chip: rekening, utang, target   |  bar mini + delta |
+----------------+-----------------+-------------------+
| NET CASHFLOW   | TINGKAT NABUNG  |  UTANG AKTIF      |
| donut kecil    | ring progress   |  progress lunas   |
+----------------+-----------------+-------------------+
|  RINGKASAN PENGELUARAN BULANAN (lebar penuh)         |
+---------------------------+--------------------------+
|  TARGET TABUNGAN          |  AKSI CEPAT              |
+---------------------------+--------------------------+
```

Mobile: semua kotak menumpuk 1 kolom (hero, lalu 2 kolom kecil untuk metrik ringkas), tablet 2 kolom.

## Detail visual

- **Hero saldo**: latar navy dalam dengan gradasi mint halus di sudut, garis grid tipis, angka sangat besar (Sora, tabular), area-chart tren 6 bulan menyatu di bawah angka. Chip status bergaya pill lembut.
- **Kartu bento**: sudut lebih besar (rounded-2xl), border tipis, bayangan berlapis lembut, hover mengangkat halus (translate + shadow). Ukuran kotak berbeda-beda (2x1, 1x1) khas bento.
- **Kartu metrik**: label eyebrow huruf kecil bertracking, angka besar, delta vs bulan lalu dengan panah dan warna semantik (hijau/merah), sparkline tipis di dasar kartu.
- **Ring/donut**: dua visual baru — rasio pengeluaran terhadap pemasukan (donut) dan tingkat menabung (ring persentase), memakai warna primary/mint dan success.
- **Aksi cepat**: dari 4 tombol kotak menjadi baris tile elegan dengan ikon gradient, judul, dan panah kecil di kanan.
- **Target tabungan**: baris progress dipertegas — nama, persen besar, bar lebih tebal, nominal saat ini vs target, badge "Tercapai" bila 100%.
- **Empty state** tetap dipakai jika belum ada data, dengan gaya kartu bento yang sama.
- Animasi masuk bertahap (stagger) dan animasi angka naik, tetap halus dan tidak berlebihan.

## Catatan teknis

- File utama yang diubah: `src/pages/Dashboard.tsx` (struktur bento + widget baru).
- Token baru di `src/index.css`: kelas `card-bento`, varian hero navy, dan bayangan berlapis; tidak ada warna hardcode — semuanya token semantik agar tema Classic dan dark tetap benar.
- Font Sora + Manrope ditambahkan di `index.html` dan dipetakan di `tailwind.config.ts` (`font-display` = Sora, `font-sans` = Manrope), sehingga seluruh aplikasi ikut rapi.
- Perhitungan baru murni turunan dari data yang sudah ada di `useFinancialData` (rasio pengeluaran, tingkat menabung, progres pelunasan utang) — tidak ada perubahan database maupun logika transaksi.
- `MonthlyBudgetTracker` tetap dipakai apa adanya, hanya dibungkus kartu bento lebar penuh.
