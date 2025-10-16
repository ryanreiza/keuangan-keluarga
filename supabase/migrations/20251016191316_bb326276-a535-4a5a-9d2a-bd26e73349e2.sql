-- Add debt_id column to transactions table for debt payment tracking
ALTER TABLE public.transactions
ADD COLUMN debt_id uuid REFERENCES public.debts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_transactions_debt_id ON public.transactions(debt_id);

-- Create function to update debt remaining amount when payment is made
CREATE OR REPLACE FUNCTION public.update_debt_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'debt_payment' AND NEW.debt_id IS NOT NULL THEN
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
$$;

-- Create trigger for debt payment
CREATE TRIGGER trigger_update_debt_on_payment
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_debt_on_payment();

-- Create function to reverse debt payment when transaction is deleted
CREATE OR REPLACE FUNCTION public.reverse_debt_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.type = 'debt_payment' AND OLD.debt_id IS NOT NULL THEN
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
$$;

-- Create trigger for reversing debt payment on delete
CREATE TRIGGER trigger_reverse_debt_payment
AFTER DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.reverse_debt_payment();