
ALTER TABLE public.monthly_budgets
  ADD COLUMN IF NOT EXISTS savings_goal_id uuid REFERENCES public.savings_goals(id) ON DELETE CASCADE;

ALTER TABLE public.monthly_budgets
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE public.monthly_budgets
  DROP CONSTRAINT IF EXISTS monthly_budgets_target_chk;
ALTER TABLE public.monthly_budgets
  ADD CONSTRAINT monthly_budgets_target_chk
  CHECK ((category_id IS NOT NULL)::int + (savings_goal_id IS NOT NULL)::int = 1);

CREATE UNIQUE INDEX IF NOT EXISTS monthly_budgets_user_savings_month_year_uidx
  ON public.monthly_budgets (user_id, savings_goal_id, month, year)
  WHERE savings_goal_id IS NOT NULL;
