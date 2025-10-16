-- Drop the existing check constraint
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the updated check constraint with debt_payment type
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'transfer', 'debt_payment'));