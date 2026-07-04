
-- 1. monthly_plan_incomes
CREATE TABLE public.monthly_plan_incomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  category text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_plan_incomes TO authenticated;
GRANT ALL ON public.monthly_plan_incomes TO service_role;
ALTER TABLE public.monthly_plan_incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own incomes select" ON public.monthly_plan_incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own incomes insert" ON public.monthly_plan_incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own incomes update" ON public.monthly_plan_incomes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own incomes delete" ON public.monthly_plan_incomes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_mpi_user_period ON public.monthly_plan_incomes(user_id, year, month);
CREATE TRIGGER update_mpi_updated_at BEFORE UPDATE ON public.monthly_plan_incomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. monthly_plan_fixed_expenses
CREATE TABLE public.monthly_plan_fixed_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  category text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  web_category_id uuid NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  remark text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_plan_fixed_expenses TO authenticated;
GRANT ALL ON public.monthly_plan_fixed_expenses TO service_role;
ALTER TABLE public.monthly_plan_fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fixed select" ON public.monthly_plan_fixed_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own fixed insert" ON public.monthly_plan_fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own fixed update" ON public.monthly_plan_fixed_expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own fixed delete" ON public.monthly_plan_fixed_expenses FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_mpfe_user_period ON public.monthly_plan_fixed_expenses(user_id, year, month);
CREATE TRIGGER update_mpfe_updated_at BEFORE UPDATE ON public.monthly_plan_fixed_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. monthly_plan_allocations
CREATE TABLE public.monthly_plan_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  percentage numeric NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  category text NOT NULL DEFAULT '',
  note text NULL,
  web_category_id uuid NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  remark text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_plan_allocations TO authenticated;
GRANT ALL ON public.monthly_plan_allocations TO service_role;
ALTER TABLE public.monthly_plan_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alloc select" ON public.monthly_plan_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own alloc insert" ON public.monthly_plan_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own alloc update" ON public.monthly_plan_allocations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own alloc delete" ON public.monthly_plan_allocations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_mpa_user_period ON public.monthly_plan_allocations(user_id, year, month);
CREATE TRIGGER update_mpa_updated_at BEFORE UPDATE ON public.monthly_plan_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
