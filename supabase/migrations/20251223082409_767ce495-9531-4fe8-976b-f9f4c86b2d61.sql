-- Update the trigger function to handle debt payments saved as 'expense' type
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if transaction has a debt_id (regardless of type being 'debt_payment' or 'expense')
  IF NEW.debt_id IS NOT NULL THEN
    -- Update the debt's remaining amount
    UPDATE public.debts
    SET 
      remaining_amount = remaining_amount - NEW.amount,
      is_paid_off = CASE 
        WHEN (remaining_amount - NEW.amount) <= 0 THEN true 
        ELSE false 
      END,
      updated_at = now()
    WHERE id = NEW.debt_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the reverse function as well
CREATE OR REPLACE FUNCTION public.reverse_debt_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if transaction has a debt_id (regardless of type)
  IF OLD.debt_id IS NOT NULL THEN
    -- Reverse the payment by adding back to remaining amount
    UPDATE public.debts
    SET 
      remaining_amount = remaining_amount + OLD.amount,
      is_paid_off = false,
      updated_at = now()
    WHERE id = OLD.debt_id;
  END IF;
  
  RETURN OLD;
END;
$function$;