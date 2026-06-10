REVOKE EXECUTE ON FUNCTION public.update_account_balance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_debt_on_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_debt_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_savings_on_contribution() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_savings_contribution() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;