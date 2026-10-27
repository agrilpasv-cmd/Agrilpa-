BEGIN;

CREATE TABLE IF NOT EXISTS public.product_contact_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  mode text NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat','admin_form')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.product_contact_settings (id,mode) VALUES (true,'chat') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.product_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted')),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  country_name text NOT NULL,
  email text NOT NULL CHECK (char_length(email) <= 254),
  phone text NOT NULL CHECK (phone ~ '^\+[1-9][0-9]{7,14}$'),
  message text CHECK (char_length(message) <= 1000),
  product_id uuid REFERENCES public.user_products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  product_image text,
  seller_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  seller_name text NOT NULL,
  requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_hash text NOT NULL CHECK (char_length(visitor_hash) = 64)
);

CREATE INDEX IF NOT EXISTS product_contacts_created_idx ON public.product_contact_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS product_contacts_unread_idx ON public.product_contact_requests (created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS product_contacts_status_idx ON public.product_contact_requests (status,created_at DESC);
CREATE INDEX IF NOT EXISTS product_contacts_visitor_idx ON public.product_contact_requests (visitor_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS product_contacts_email_idx ON public.product_contact_requests (email,created_at DESC);
CREATE INDEX IF NOT EXISTS product_contacts_product_idx ON public.product_contact_requests (product_id);
CREATE INDEX IF NOT EXISTS product_contacts_seller_idx ON public.product_contact_requests (seller_id);
CREATE INDEX IF NOT EXISTS product_contacts_requester_idx ON public.product_contact_requests (requester_id);

ALTER TABLE public.product_contact_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_contact_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_contact_settings, public.product_contact_requests FROM anon, authenticated;
GRANT ALL ON TABLE public.product_contact_settings, public.product_contact_requests TO service_role;

CREATE OR REPLACE FUNCTION public.submit_product_contact_request (
  p_product_id uuid, p_request_key uuid, p_full_name text,
  p_country_code text, p_country_name text, p_email text, p_phone text,
  p_message text, p_visitor_hash text, p_requester_id uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_mode text;
  v_product record;
  v_existing record;
  v_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('request:' || p_request_key::text,0));
  SELECT id,email,product_id INTO v_existing FROM public.product_contact_requests WHERE request_key = p_request_key;
  IF FOUND THEN
    IF v_existing.email <> lower(trim(p_email)) OR v_existing.product_id IS DISTINCT FROM p_product_id THEN
      RAISE EXCEPTION 'invalid_request_key' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id',v_existing.id);
  END IF;

  SELECT mode INTO v_mode FROM public.product_contact_settings WHERE id = true FOR SHARE;
  IF v_mode IS DISTINCT FROM 'admin_form' THEN
    RAISE EXCEPTION 'contact_mode_changed' USING ERRCODE = '22023';
  END IF;

  SELECT p.id,p.user_id,p.title,p.image,coalesce(nullif(u.company_name,''),u.full_name,'Vendedor Agrilpa') AS seller_name
    INTO v_product FROM public.user_products p LEFT JOIN public.users u ON u.id = p.user_id
    WHERE p.id = p_product_id AND p.is_visible = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_unavailable' USING ERRCODE = 'P0002';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('visitor:' || p_visitor_hash,0));
  PERFORM pg_advisory_xact_lock(hashtextextended('email:' || lower(trim(p_email)),0));
  IF (SELECT count(*) FROM public.product_contact_requests WHERE visitor_hash = p_visitor_hash AND created_at > now() - interval '15 minutes') >= 10
    OR (SELECT count(*) FROM public.product_contact_requests WHERE email = lower(trim(p_email)) AND created_at > now() - interval '15 minutes') >= 5 THEN
    RAISE EXCEPTION 'contact_rate_limit' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.product_contact_requests (
    request_key,full_name,country_code,country_name,email,phone,message,
    product_id,product_title,product_image,seller_id,seller_name,requester_id,visitor_hash
  ) VALUES (
    p_request_key,trim(p_full_name),p_country_code,p_country_name,lower(trim(p_email)),p_phone,nullif(trim(p_message),''),
    v_product.id,v_product.title,v_product.image,v_product.user_id,v_product.seller_name,p_requester_id,p_visitor_hash
  ) RETURNING id INTO v_id;
  RETURN jsonb_build_object('id',v_id);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_product_contact_request(uuid,uuid,text,text,text,text,text,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_product_contact_request(uuid,uuid,text,text,text,text,text,text,text,uuid) TO service_role;

COMMIT;
