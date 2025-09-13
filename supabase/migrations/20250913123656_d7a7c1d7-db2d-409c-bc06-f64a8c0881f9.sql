-- Add transfer functionality to transactions table
-- Add destination_account_id column for transfers
ALTER TABLE public.transactions 
ADD COLUMN destination_account_id uuid;

-- Add foreign key constraint (optional, but good practice)
-- ALTER TABLE public.transactions 
-- ADD CONSTRAINT fk_destination_account 
-- FOREIGN KEY (destination_account_id) REFERENCES public.accounts(id);

-- Update the account balance trigger to handle transfers
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
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

-- Create trigger for account balance updates
DROP TRIGGER IF EXISTS update_account_balance_trigger ON public.transactions;
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance();