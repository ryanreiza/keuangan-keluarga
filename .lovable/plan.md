

# Saran Optimasi Aplikasi Keuangan

Setelah meninjau seluruh kode, berikut area yang perlu dioptimalkan:

---

## 1. Halaman Pengaturan Belum Fungsional
Halaman Settings saat ini hanya tampilan statis — tombol "Simpan Perubahan", "Ubah Password", dan switch notifikasi/dark mode **tidak terhubung ke backend**. Perlu difungsikan:
- Update profil (nama) ke Supabase Auth
- Ubah password via Supabase Auth
- Dark mode toggle dengan persistensi ke localStorage
- Preferensi notifikasi disimpan ke database

## 2. Lazy Loading & Code Splitting
Semua halaman di-import secara langsung di `App.tsx`, artinya seluruh kode dimuat sekaligus saat pertama kali buka. Gunakan `React.lazy()` + `Suspense` agar halaman dimuat hanya saat diakses — mempercepat initial load.

## 3. Tombol "Tambah Transaksi" di Dashboard Belum Berfungsi
Tombol di Dashboard hanya tampilan, tidak membuka form atau mengarahkan ke halaman transaksi.

## 4. Tombol "Quick Actions" di Dashboard Tidak Fungsional
Keempat tombol aksi cepat (Analisis Kategori, Laporan Bulanan, Set Target Baru, Rekening Baru) belum terhubung ke halaman masing-masing.

## 5. Empty States & Error Handling
Beberapa halaman tidak menampilkan pesan yang baik saat data kosong (misal: Dashboard tanpa transaksi tetap menampilkan angka 0 tanpa panduan). Perlu empty state yang informatif dengan CTA untuk menambah data.

## 6. Konfirmasi Delete yang Konsisten
Halaman Savings dan beberapa tempat lain melakukan delete langsung tanpa dialog konfirmasi, berbeda dengan Transactions yang sudah punya `DeleteTransactionDialog`.

## 7. Validasi Form Lebih Ketat
Form transaksi dan form lainnya belum memvalidasi input secara menyeluruh (misalnya: nominal negatif, tanggal di masa depan yang tidak masuk akal, dll).

---

## Rekomendasi Prioritas

| Prioritas | Item | Dampak |
|-----------|------|--------|
| Tinggi | Fungsikan halaman Settings | User tidak bisa ubah profil/password |
| Tinggi | Fungsikan tombol Dashboard | UX buruk — tombol ada tapi tidak kerja |
| Sedang | Lazy loading halaman | Performa initial load |
| Sedang | Empty states | UX untuk user baru |
| Rendah | Konfirmasi delete konsisten | Mencegah hapus tidak sengaja |
| Rendah | Validasi form | Data integrity |

---

## Detail Teknis

### Settings Fungsional
- Gunakan `supabase.auth.updateUser()` untuk update nama dan password
- Buat tabel `user_preferences` untuk menyimpan preferensi notifikasi
- Implementasi dark mode dengan CSS class toggle + localStorage

### Lazy Loading
```text
// App.tsx
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
// ... dst, bungkus dengan <Suspense fallback={<Loader />}>
```

### Quick Actions Dashboard
- Hubungkan 4 tombol ke `navigate('/reports')`, `navigate('/savings')`, `navigate('/accounts')`, dll
- Tombol "Tambah Transaksi" buka dialog atau navigate ke `/transactions`

