CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Account access denied: user does not own this account';
    END IF;
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' AND NEW.destination_account_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.destination_account_id AND user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'Destination account access denied: user does not own this account';
      END IF;
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.destination_account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = OLD.account_id AND user_id = OLD.user_id) THEN
      RAISE EXCEPTION 'Account access denied: user does not own this account';
    END IF;
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' AND OLD.destination_account_id IS NOT NULL THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.destination_account_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' AND OLD.destination_account_id IS NOT NULL THEN
      UPDATE public.accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE public.accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.destination_account_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Account access denied: user does not own this account';
    END IF;
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' AND NEW.destination_account_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.destination_account_id AND user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'Destination account access denied: user does not own this account';
      END IF;
      UPDATE public.accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.destination_account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS update_account_balance_trigger ON public.transactions;
CREATE TRIGGER update_account_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();