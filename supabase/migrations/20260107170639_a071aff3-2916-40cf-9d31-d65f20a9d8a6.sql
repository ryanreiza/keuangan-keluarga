-- Fix inconsistent debt data where remaining_amount is 0 but is_paid_off is false
UPDATE public.debts
SET is_paid_off = true
WHERE remaining_amount <= 0 AND is_paid_off = false;

-- Fix inconsistent debt data where remaining_amount > 0 but is_paid_off is true
UPDATE public.debts
SET is_paid_off = false
WHERE remaining_amount > 0 AND is_paid_off = true;