
# Rencana: Palet Hangat Navy · Mint · Cream

Mengubah tema light mode agar lebih nyaman dipakai harian: background cream lembut, surface beige untuk pembeda, sidebar navy medium (tidak lagi "lubang hitam"), navy & mint tetap dominan sebagai brand identity. Dark mode tidak diubah.

## Token baru (light mode) — `src/index.css`

**Canvas & surface (cream/beige):**
- `--background`: `40 30% 97%` (cream lembut, hangat)
- `--card`: `40 25% 99%` (putih krem)
- `--surface`: `38 25% 94%` (beige muted untuk section pembeda)
- `--secondary`: `38 22% 92%`
- `--muted`: `38 20% 93%`
- `--muted-foreground`: `30 8% 40%` (abu hangat, bukan abu dingin)
- `--border`: `36 18% 86%` (border beige halus)
- `--input`: `36 18% 88%`
- `--popover`: `40 25% 99%`

**Brand (navy lebih hidup, tidak terlalu gelap):**
- `--primary`: `218 55% 22%`
- `--primary-light`: `218 45% 35%`
- `--primary-dark`: `218 65% 16%`
- `--primary-glow`: `165 70% 55%`
- `--foreground`: `218 40% 14%` (navy tint, bukan hitam mati)
- `--card-foreground` / `--surface-foreground` / `--popover-foreground`: sama

**Aksen mint:**
- `--accent-brand`: `165 65% 42%`
- `--accent-brand-foreground`: `218 65% 14%`
- `--accent`: `165 55% 92%` (mint pucat untuk hover/badge)
- `--accent-foreground`: `165 75% 22%`
- `--ring`: `165 65% 45%`

**Status (warna hangat, tidak neon):**
- `--success`: `160 60% 38%` / `--success-bg`: `160 50% 93%`
- `--danger`: `8 65% 52%` (terracotta hangat, bukan merah neon) / `--danger-bg`: `12 60% 95%`
- `--warning`: `35 88% 50%` / `--warning-bg`: `38 85% 93%`
- `--destructive`: `8 65% 52%`

**Sidebar (navy medium + teks cream):**
- `--sidebar-background`: `218 45% 18%` (lebih terang dari `222 70% 10%` saat ini)
- `--sidebar-foreground`: `40 25% 90%` (teks cream hangat)
- `--sidebar-primary`: `165 70% 55%` (mint)
- `--sidebar-primary-foreground`: `218 65% 14%`
- `--sidebar-accent`: `218 38% 24%` (hover state)
- `--sidebar-accent-foreground`: `40 30% 96%`
- `--sidebar-border`: `218 35% 26%`
- `--sidebar-ring`: `165 70% 55%`

**Gradient & shadow (selaras):**
- `--gradient-primary`: `linear-gradient(135deg, hsl(218 60% 16%) 0%, hsl(218 50% 26%) 55%, hsl(165 65% 42%) 100%)`
- `--gradient-primary-soft`: `linear-gradient(135deg, hsl(40 35% 96%), hsl(165 55% 93%))`
- `--gradient-warm` (baru): `linear-gradient(135deg, hsl(40 35% 97%), hsl(36 30% 92%))`
- `--gradient-success`: `linear-gradient(135deg, hsl(160 60% 38%), hsl(165 65% 45%))`
- `--gradient-surface`: `linear-gradient(180deg, hsl(40 32% 98%), hsl(38 25% 94%))`
- `--gradient-card`: `linear-gradient(145deg, hsl(40 25% 99%), hsl(38 22% 96%))`
- `--gradient-mesh`: titik-titik radial pakai cream + mint pucat + navy pucat (bukan biru dingin)
- Shadow: ganti tint dari `222 47% 11%` ke `218 40% 14%` agar bayangan terasa selaras dengan navy hangat
- `--shadow-elegant`: `0 14px 40px -12px hsl(218 55% 18% / 0.22)` (sedikit lebih halus)
- `--shadow-glow`: `0 0 40px hsl(165 70% 55% / 0.32)`

## File yang diubah

- **`src/index.css`** — hanya blok `:root` (light mode token) + utility `bg-mesh`/`gradient-warm` jika perlu. Dark mode tidak disentuh.
- **`tailwind.config.ts`** — tambah satu entry `'gradient-warm': 'var(--gradient-warm)'` di `backgroundImage` agar bisa dipakai komponen nanti. Tidak ada perubahan struktural.

## Yang TIDAK diubah

- Dark mode token
- Struktur komponen (semua otomatis ikut karena pakai semantic token)
- Logika/business code
- Sidebar/MobileBottomNav (sudah dirapikan di iterasi sebelumnya)
- PWA manifest & ikon

## Verifikasi setelah implementasi

1. Screenshot Dashboard (desktop) — cek kehangatan & kontras
2. Screenshot Transactions (route saat ini) — cek table & form
3. Screenshot sidebar — pastikan navy tidak lagi "lubang hitam"
4. Cek mode mobile bottom nav tetap kontras
5. Cek tombol primer (navy) & CTA mint masih menonjol di atas cream

Hasil yang diharapkan: kesan **"private banking hangat"** — profesional, premium, tapi tidak dingin atau klinis. Cocok dipakai berjam-jam.
