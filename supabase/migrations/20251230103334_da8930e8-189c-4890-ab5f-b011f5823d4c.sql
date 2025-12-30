-- Create trigger to automatically update debt when a transaction with debt_id is inserted
CREATE TRIGGER update_debt_on_transaction_insert
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_debt_on_payment();

-- Create trigger to reverse debt payment when transaction is deleted
CREATE TRIGGER reverse_debt_on_transaction_delete
BEFORE DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.reverse_debt_payment();