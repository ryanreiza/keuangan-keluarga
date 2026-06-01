DROP TRIGGER IF EXISTS update_debt_on_transaction_insert ON public.transactions;
DROP TRIGGER IF EXISTS reverse_debt_on_transaction_delete ON public.transactions;

UPDATE public.debts d
SET
  remaining_amount = d.total_amount - COALESCE(p.paid, 0),
  is_paid_off = (d.total_amount - COALESCE(p.paid, 0)) <= 0,
  updated_at = now()
FROM (
  SELECT debt_id, SUM(amount) AS paid
  FROM public.transactions
  WHERE debt_id IS NOT NULL
  GROUP BY debt_id
) p
WHERE p.debt_id = d.id;