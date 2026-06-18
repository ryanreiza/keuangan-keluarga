## Penyebab
`upsertBudget` untuk baris tabungan memakai `onConflict: 'user_id,savings_goal_id,month,year'`. Di database, kombinasi itu hanya punya **partial unique index** (`WHERE savings_goal_id IS NOT NULL`), bukan unique constraint penuh. PostgREST `upsert` butuh constraint/unique index yang dia bisa kenali — partial index tidak diterima sebagai conflict target lewat REST, sehingga muncul "Error saving budget".

## Perbaikan

### `src/hooks/useMonthlyBudgets.ts`
Ganti jalur savings agar tidak pakai `upsert` PostgREST dengan partial index. Alur baru untuk `savings_goal_id`:
1. `select id` dari `monthly_budgets` dengan filter `user_id`, `savings_goal_id`, `month`, `year`.
2. Kalau row ada → `update` `expected_amount` berdasarkan `id`.
3. Kalau tidak ada → `insert` row baru (`category_id: null`, `savings_goal_id: <id>`).

Jalur kategori tetap memakai `upsert` dengan `onConflict: 'user_id,category_id,month,year'` (constraint asli masih ada).

State lokal `setBudgets` tetap diperbarui dari row hasil `update`/`insert` seperti sebelumnya.

Tidak ada perubahan skema database, tidak ada perubahan UI lain.