# Perbaikan Warna Status Target Alokasi

## Masalah

Badge status di tabel "Target Alokasi Keuangan" memakai kelas `bg-destructive/15 text-destructive border-destructive/30` untuk "Melebihi Target". Warna `destructive` memang ada sebagai variabel CSS, tetapi **tidak terdaftar di `tailwind.config.ts`**, sehingga kelas itu tidak pernah dihasilkan — badge "Melebihi Target" tampil polos tanpa warna (terlihat pada tangkapan layar).

Selain itu "Sedang Proses" memakai `primary` yang pada tema ini adalah navy gelap, sehingga tidak terbaca sebagai biru yang jelas dan mirip abu-abu.

## Yang akan diubah

1. **Token warna biru (`--info`)**
   - Tambahkan `--info`, `--info-foreground` di `src/index.css` untuk ketiga varian tema (cream default, `.theme-classic`, dark) dengan nuansa biru cerah.
   - Daftarkan `info` di `tailwind.config.ts` agar kelasnya tergenerasi.

2. **Badge status di `src/pages/MonthlyPlan.tsx`**
   - Melebihi Target → merah: `bg-danger/15 text-danger border-danger/40`
   - Target Tercapai → hijau: `bg-success/15 text-success border-success/40`
   - Mendekati Batas → kuning: `bg-warning/20 text-warning border-warning/40`
   - Sedang Proses → biru: `bg-info/15 text-info border-info/40`
   - Belum dipetakan → tetap abu-abu netral
   - Tambahkan `font-medium` agar teks status terbaca jelas di semua warna.

## Catatan teknis

Semua warna tetap memakai token semantik (tanpa hex/utility hardcoded), sehingga tema Cream dan Classic maupun mode gelap tetap konsisten.
