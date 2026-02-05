-- Fix 1: Update RLS policy for transactions INSERT to validate cross-references
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;

-- Create new INSERT policy with cross-reference validation
CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.accounts WHERE id = account_id AND user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.categories WHERE id = category_id AND user_id = auth.uid())
  AND (
    destination_account_id IS NULL 
    OR EXISTS (SELECT 1 FROM public.accounts WHERE id = destination_account_id AND user_id = auth.uid())
  )
  AND (
    debt_id IS NULL
    OR EXISTS (SELECT 1 FROM public.debts WHERE id = debt_id AND user_id = auth.uid())
  )
);

-- Fix 2: Update SECURITY DEFINER functions with ownership verification

-- Update update_account_balance() function with ownership checks
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Verify user owns the account before updating balance
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Account access denied: user does not own this account';
    END IF;
    
    -- Handle regular income/expense transactions
    IF NEW.type = 'income' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' AND NEW.destination_account_id IS NOT NULL THEN
      -- Verify user owns destination account for transfers
      IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.destination_account_id AND user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'Destination account access denied: user does not own this account';
      END IF;
      
      -- Handle transfer: subtract from source account, add to destination account
      UPDATE public.accounts 
      SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.account_id;
      
      UPDATE public.accounts 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.destination_account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Verify user owns the account before reversing balance
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = OLD.account_id AND user_id = OLD.user_id) THEN
      RAISE EXCEPTION 'Account access denied: user does not own this account';
    END IF;
    
    -- Reverse the balance changes when transaction is deleted
    IF OLD.type = 'income' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' AND OLD.destination_account_id IS NOT NULL THEN
      -- Verify user owns destination account for transfers
      IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = OLD.destination_account_id AND user_id = OLD.user_id) THEN
        RAISE EXCEPTION 'Destination account access denied: user does not own this account';
      END IF;
      
      -- Reverse transfer: add back to source account, subtract from destination account
      UPDATE public.accounts 
      SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
      
      UPDATE public.accounts 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.destination_account_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update update_debt_on_payment() function with ownership checks
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if transaction has a debt_id (regardless of type being 'debt_payment' or 'expense')
  IF NEW.debt_id IS NOT NULL THEN
    -- Verify user owns the debt before updating
    IF NOT EXISTS (SELECT 1 FROM public.debts WHERE id = NEW.debt_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Debt access denied: user does not own this debt';
    END IF;
    
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

-- Update reverse_debt_payment() function with ownership checks
CREATE OR REPLACE FUNCTION public.reverse_debt_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if transaction has a debt_id (regardless of type)
  IF OLD.debt_id IS NOT NULL THEN
    -- Verify user owns the debt before reversing
    IF NOT EXISTS (SELECT 1 FROM public.debts WHERE id = OLD.debt_id AND user_id = OLD.user_id) THEN
      RAISE EXCEPTION 'Debt access denied: user does not own this debt';
    END IF;
    
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