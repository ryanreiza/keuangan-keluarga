
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_remaining numeric;
  v_total numeric;
  v_creditor text;
BEGIN
  IF NEW.debt_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.debts WHERE id = NEW.debt_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Debt access denied: user does not own this debt';
    END IF;

    SELECT remaining_amount, total_amount, creditor_name
    INTO v_remaining, v_total, v_creditor
    FROM public.debts
    WHERE id = NEW.debt_id
    FOR UPDATE;

    IF NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Jumlah pembayaran utang harus lebih dari 0';
    END IF;

    IF NEW.amount > v_remaining THEN
      RAISE EXCEPTION 'Pembayaran (Rp %) melebihi sisa utang % (sisa Rp %). Total pelunasan tidak boleh melampaui nilai utang awal Rp %.',
        NEW.amount, v_creditor, v_remaining, v_total;
    END IF;

    UPDATE public.debts
    SET
      remaining_amount = GREATEST(remaining_amount - NEW.amount, 0),
      is_paid_off = (remaining_amount - NEW.amount) <= 0,
      updated_at = now()
    WHERE id = NEW.debt_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reverse_debt_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric;
  v_new_remaining numeric;
BEGIN
  IF OLD.debt_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.debts WHERE id = OLD.debt_id AND user_id = OLD.user_id) THEN
      RAISE EXCEPTION 'Debt access denied: user does not own this debt';
    END IF;

    SELECT total_amount INTO v_total
    FROM public.debts
    WHERE id = OLD.debt_id
    FOR UPDATE;

    UPDATE public.debts
    SET
      remaining_amount = LEAST(remaining_amount + OLD.amount, v_total),
      is_paid_off = (LEAST(remaining_amount + OLD.amount, v_total)) <= 0,
      updated_at = now()
    WHERE id = OLD.debt_id;
  END IF;

  RETURN OLD;
END;
$function$;
