-- =============================================================
-- TABUNGAN EMAS (Gold Savings)
-- =============================================================

CREATE TABLE public.gold_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text,
  grams numeric NOT NULL DEFAULT 0 CHECK (grams >= 0),
  total_cost numeric NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gold_accounts TO authenticated;
GRANT ALL ON public.gold_accounts TO service_role;
ALTER TABLE public.gold_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gold accounts"
ON public.gold_accounts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TABLE public.gold_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gold_account_id uuid NOT NULL REFERENCES public.gold_accounts(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('buy','sell')),
  grams numeric NOT NULL CHECK (grams > 0),
  price_per_gram numeric NOT NULL CHECK (price_per_gram > 0),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  cost_basis numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gold_transactions TO authenticated;
GRANT ALL ON public.gold_transactions TO service_role;
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gold transactions"
ON public.gold_transactions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================================
-- Trigger: sinkronisasi simpanan emas (gram & modal)
-- =============================================================

CREATE OR REPLACE FUNCTION public.update_gold_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_grams numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT grams INTO v_grams
    FROM public.gold_accounts
    WHERE id = NEW.gold_account_id AND user_id = NEW.user_id
    FOR UPDATE;

    IF v_grams IS NULL THEN
      RAISE EXCEPTION 'Gold account access denied: user does not own this gold account';
    END IF;

    IF NEW.type = 'sell' AND NEW.grams > v_grams THEN
      RAISE EXCEPTION 'Penjualan emas (% gram) melebihi simpanan emas (% gram)', NEW.grams, v_grams;
    END IF;

    IF NEW.type = 'buy' THEN
      UPDATE public.gold_accounts
      SET grams = grams + NEW.grams,
          total_cost = total_cost + NEW.total_amount,
          updated_at = now()
      WHERE id = NEW.gold_account_id;
    ELSE
      UPDATE public.gold_accounts
      SET grams = grams - NEW.grams,
          total_cost = GREATEST(total_cost - COALESCE(NEW.cost_basis, NEW.total_amount), 0),
          updated_at = now()
      WHERE id = NEW.gold_account_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT grams INTO v_grams
    FROM public.gold_accounts
    WHERE id = OLD.gold_account_id AND user_id = OLD.user_id
    FOR UPDATE;

    IF v_grams IS NULL THEN
      RETURN OLD; -- akun emas sedang dihapus (cascade); tidak ada yang perlu direkonsiliasi
    END IF;

    IF OLD.type = 'buy' THEN
      UPDATE public.gold_accounts
      SET grams = GREATEST(grams - OLD.grams, 0),
          total_cost = GREATEST(total_cost - OLD.total_amount, 0),
          updated_at = now()
      WHERE id = OLD.gold_account_id;
    ELSE
      UPDATE public.gold_accounts
      SET grams = grams + OLD.grams,
          total_cost = total_cost + COALESCE(OLD.cost_basis, OLD.total_amount),
          updated_at = now()
      WHERE id = OLD.gold_account_id;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Balikkan dampak baris lama (lewati diam-diam bila akun sudah tidak ada)
    SELECT grams INTO v_grams
    FROM public.gold_accounts
    WHERE id = OLD.gold_account_id AND user_id = OLD.user_id
    FOR UPDATE;

    IF v_grams IS NOT NULL THEN
      IF OLD.type = 'buy' THEN
        UPDATE public.gold_accounts
        SET grams = GREATEST(grams - OLD.grams, 0),
            total_cost = GREATEST(total_cost - OLD.total_amount, 0),
            updated_at = now()
        WHERE id = OLD.gold_account_id;
      ELSE
        UPDATE public.gold_accounts
        SET grams = grams + OLD.grams,
            total_cost = total_cost + COALESCE(OLD.cost_basis, OLD.total_amount),
            updated_at = now()
        WHERE id = OLD.gold_account_id;
      END IF;
    END IF;

    -- Terapkan dampak baris baru
    SELECT grams INTO v_grams
    FROM public.gold_accounts
    WHERE id = NEW.gold_account_id AND user_id = NEW.user_id
    FOR UPDATE;

    IF v_grams IS NULL THEN
      RAISE EXCEPTION 'Gold account access denied: user does not own this gold account';
    END IF;

    IF NEW.type = 'sell' AND NEW.grams > v_grams THEN
      RAISE EXCEPTION 'Penjualan emas (% gram) melebihi simpanan emas (% gram)', NEW.grams, v_grams;
    END IF;

    IF NEW.type = 'buy' THEN
      UPDATE public.gold_accounts
      SET grams = grams + NEW.grams,
          total_cost = total_cost + NEW.total_amount,
          updated_at = now()
      WHERE id = NEW.gold_account_id;
    ELSE
      UPDATE public.gold_accounts
      SET grams = grams - NEW.grams,
          total_cost = GREATEST(total_cost - COALESCE(NEW.cost_basis, NEW.total_amount), 0),
          updated_at = now()
      WHERE id = NEW.gold_account_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

CREATE TRIGGER update_gold_account_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.gold_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_gold_account();

-- =============================================================
-- RPC: beli emas (pengeluaran + penambahan simpanan emas)
-- =============================================================

CREATE OR REPLACE FUNCTION public.record_gold_purchase(
  p_gold_account_id uuid,
  p_account_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_grams numeric,
  p_transaction_date date DEFAULT CURRENT_DATE,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_category_id uuid;
  v_transaction_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.gold_accounts WHERE id = p_gold_account_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Gold account access denied: user does not own this gold account';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Account access denied: user does not own this account';
  END IF;

  IF p_category_id IS NULL THEN
    SELECT id INTO v_category_id
    FROM public.categories
    WHERE user_id = v_user AND type = 'expense' AND name = 'Tabungan Emas'
    LIMIT 1;
    IF v_category_id IS NULL THEN
      INSERT INTO public.categories (user_id, name, type)
      VALUES (v_user, 'Tabungan Emas', 'expense')
      RETURNING id INTO v_category_id;
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND user_id = v_user) THEN
      RAISE EXCEPTION 'Category access denied: user does not own this category';
    END IF;
    v_category_id := p_category_id;
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Jumlah pembelian emas harus lebih dari 0';
  END IF;
  IF p_grams IS NULL OR p_grams <= 0 THEN
    RAISE EXCEPTION 'Berat emas harus lebih dari 0';
  END IF;

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, transaction_date)
  VALUES (v_user, p_account_id, v_category_id, 'expense', p_amount, COALESCE(p_description, 'Beli emas'), p_transaction_date)
  RETURNING id INTO v_transaction_id;

  INSERT INTO public.gold_transactions (user_id, gold_account_id, transaction_id, type, grams, price_per_gram, total_amount, notes)
  VALUES (v_user, p_gold_account_id, v_transaction_id, 'buy', p_grams, p_amount / p_grams, p_amount, p_description);

  RETURN json_build_object('transaction_id', v_transaction_id);
END;
$function$;

-- =============================================================
-- RPC: jual emas (pemasukan baru + pengurangan simpanan emas)
-- =============================================================

CREATE OR REPLACE FUNCTION public.record_gold_sale(
  p_gold_account_id uuid,
  p_account_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_grams numeric,
  p_transaction_date date DEFAULT CURRENT_DATE,
  p_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_grams numeric;
  v_cost numeric;
  v_basis numeric;
  v_category_id uuid;
  v_transaction_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT grams, total_cost INTO v_grams, v_cost
  FROM public.gold_accounts
  WHERE id = p_gold_account_id AND user_id = v_user
  FOR UPDATE;

  IF v_grams IS NULL THEN
    RAISE EXCEPTION 'Gold account access denied: user does not own this gold account';
  END IF;

  IF p_grams IS NULL OR p_grams <= 0 THEN
    RAISE EXCEPTION 'Berat emas yang dijual harus lebih dari 0';
  END IF;
  IF p_grams > v_grams THEN
    RAISE EXCEPTION 'Penjualan emas (% gram) melebihi simpanan emas (% gram)', p_grams, v_grams;
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Jumlah penjualan emas harus lebih dari 0';
  END IF;

  v_basis := CASE WHEN v_grams > 0 THEN (v_cost / v_grams) * p_grams ELSE 0 END;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Account access denied: user does not own this account';
  END IF;

  IF p_category_id IS NULL THEN
    SELECT id INTO v_category_id
    FROM public.categories
    WHERE user_id = v_user AND type = 'income' AND name = 'Penjualan Emas'
    LIMIT 1;
    IF v_category_id IS NULL THEN
      INSERT INTO public.categories (user_id, name, type)
      VALUES (v_user, 'Penjualan Emas', 'income')
      RETURNING id INTO v_category_id;
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND user_id = v_user) THEN
      RAISE EXCEPTION 'Category access denied: user does not own this category';
    END IF;
    v_category_id := p_category_id;
  END IF;

  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, description, transaction_date)
  VALUES (v_user, p_account_id, v_category_id, 'income', p_amount, COALESCE(p_description, 'Jual emas'), p_transaction_date)
  RETURNING id INTO v_transaction_id;

  INSERT INTO public.gold_transactions (user_id, gold_account_id, transaction_id, type, grams, price_per_gram, total_amount, cost_basis, notes)
  VALUES (v_user, p_gold_account_id, v_transaction_id, 'sell', p_grams, p_amount / p_grams, p_amount, v_basis, p_description);

  RETURN json_build_object('transaction_id', v_transaction_id, 'cost_basis', v_basis, 'realized_gain', p_amount - v_basis);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.record_gold_purchase(uuid, uuid, uuid, numeric, numeric, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_gold_purchase(uuid, uuid, uuid, numeric, numeric, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.record_gold_sale(uuid, uuid, uuid, numeric, numeric, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_gold_sale(uuid, uuid, uuid, numeric, numeric, date, text) TO authenticated;

-- =============================================================
-- Harga emas terkini (diisi pengguna) di profil
-- =============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gold_price_per_gram numeric;

-- =============================================================
-- updated_at triggers
-- =============================================================

CREATE TRIGGER update_gold_accounts_updated_at
BEFORE UPDATE ON public.gold_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gold_transactions_updated_at
BEFORE UPDATE ON public.gold_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- Realtime
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gold_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gold_accounts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gold_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gold_transactions;
  END IF;
END $$;