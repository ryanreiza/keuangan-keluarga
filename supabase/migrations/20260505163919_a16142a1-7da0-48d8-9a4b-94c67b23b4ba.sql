
-- 1. Add savings_goal_id column to transactions
ALTER TABLE public.transactions
ADD COLUMN savings_goal_id uuid NULL;

-- 2. Replace INSERT policy to validate ownership of savings_goal_id
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;

CREATE POLICY "Users can create their own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  AND (EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid()))
  AND (EXISTS (SELECT 1 FROM categories WHERE categories.id = transactions.category_id AND categories.user_id = auth.uid()))
  AND (transactions.destination_account_id IS NULL OR EXISTS (SELECT 1 FROM accounts WHERE accounts.id = transactions.destination_account_id AND accounts.user_id = auth.uid()))
  AND (transactions.debt_id IS NULL OR EXISTS (SELECT 1 FROM debts WHERE debts.id = transactions.debt_id AND debts.user_id = auth.uid()))
  AND (transactions.savings_goal_id IS NULL OR EXISTS (SELECT 1 FROM savings_goals WHERE savings_goals.id = transactions.savings_goal_id AND savings_goals.user_id = auth.uid()))
);

-- 3. Trigger function: update savings goal on contribution insert
CREATE OR REPLACE FUNCTION public.update_savings_on_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.savings_goal_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.savings_goals WHERE id = NEW.savings_goal_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Savings goal access denied: user does not own this goal';
    END IF;

    UPDATE public.savings_goals
    SET
      current_amount = COALESCE(current_amount, 0) + NEW.amount,
      is_achieved = CASE
        WHEN (COALESCE(current_amount, 0) + NEW.amount) >= target_amount THEN true
        ELSE false
      END,
      updated_at = now()
    WHERE id = NEW.savings_goal_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger function: reverse on delete
CREATE OR REPLACE FUNCTION public.reverse_savings_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.savings_goal_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.savings_goals WHERE id = OLD.savings_goal_id AND user_id = OLD.user_id) THEN
      RAISE EXCEPTION 'Savings goal access denied: user does not own this goal';
    END IF;

    UPDATE public.savings_goals
    SET
      current_amount = GREATEST(COALESCE(current_amount, 0) - OLD.amount, 0),
      is_achieved = CASE
        WHEN (COALESCE(current_amount, 0) - OLD.amount) >= target_amount THEN true
        ELSE false
      END,
      updated_at = now()
    WHERE id = OLD.savings_goal_id;
  END IF;

  RETURN OLD;
END;
$$;

-- 5. Triggers
DROP TRIGGER IF EXISTS trg_update_savings_on_contribution ON public.transactions;
CREATE TRIGGER trg_update_savings_on_contribution
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_savings_on_contribution();

DROP TRIGGER IF EXISTS trg_reverse_savings_contribution ON public.transactions;
CREATE TRIGGER trg_reverse_savings_contribution
AFTER DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.reverse_savings_contribution();
