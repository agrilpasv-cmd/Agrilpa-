-- Agrilpa: solicitudes de cotización y comunicación dentro de la plataforma.
-- Pegar el archivo completo en Supabase > SQL Editor y ejecutar antes de usar el nuevo formulario.
-- Migración aditiva: conserva las cotizaciones y los pedidos existentes. Se puede volver a ejecutar.
BEGIN;

ALTER TABLE public.quotations
  ALTER COLUMN quantity TYPE numeric USING quantity::numeric,
  ALTER COLUMN contact_method SET DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS buyer_id uuid,
  ADD COLUMN IF NOT EXISTS quantity_unit text,
  ADD COLUMN IF NOT EXISTS destination_location text,
  ADD COLUMN IF NOT EXISTS delivery_method text,
  ADD COLUMN IF NOT EXISTS purchase_frequency text,
  ADD COLUMN IF NOT EXISTS date_flexible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_unit_price numeric,
  ADD COLUMN IF NOT EXISTS agreed_currency text,
  ADD COLUMN IF NOT EXISTS target_price numeric,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS incoterm text,
  ADD COLUMN IF NOT EXISTS container_size text,
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS origin_country text,
  ADD COLUMN IF NOT EXISTS maturity text,
  ADD COLUMN IF NOT EXISTS packaging_type text,
  ADD COLUMN IF NOT EXISTS packaging_size text,
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS incoterm text;

COMMENT ON COLUMN public.quotations.target_price IS 'Presupuesto unitario del comprador; no equivale al precio acordado.';
COMMENT ON COLUMN public.quotations.agreed_unit_price IS 'Precio unitario confirmado por el vendedor al crear el pedido.';
COMMENT ON COLUMN public.quotations.destination_location IS 'Ciudad o puerto de destino. No se necesita una dirección privada al solicitar la cotización.';

-- La decisión y el pedido se guardan en una sola transacción.
-- El bloqueo de la cotización impide crear pedidos duplicados con dos clics simultáneos.
CREATE OR REPLACE FUNCTION public.decide_quotation(
  p_quotation_id uuid, p_seller_id uuid, p_status text,
  p_unit_price numeric DEFAULT NULL, p_currency text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  q public.quotations%ROWTYPE;
  p public.user_products%ROWTYPE;
  v_order_id uuid;
  v_email text;
BEGIN
  SELECT * INTO q FROM public.quotations WHERE id = p_quotation_id FOR UPDATE;
  IF NOT FOUND OR q.seller_id IS DISTINCT FROM p_seller_id THEN
    RAISE EXCEPTION 'quotation_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'invalid_decision' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_order_id FROM public.orders WHERE quotation_id = q.id ORDER BY created_at LIMIT 1;
  IF q.status = p_status THEN
    RETURN jsonb_build_object('status', q.status, 'orderId', v_order_id,
      'unitPrice', q.agreed_unit_price, 'currency', q.agreed_currency);
  END IF;
  IF q.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'quotation_already_decided' USING ERRCODE = '22023';
  END IF;

  IF p_status = 'accepted' THEN
    IF q.buyer_id IS NULL OR p_unit_price IS NULL OR p_unit_price <= 0 OR p_unit_price > 1000000000
      OR p_unit_price::text IN ('NaN', 'Infinity', '-Infinity')
      OR p_currency IS NULL OR p_currency NOT IN ('USD', 'EUR') THEN
      RAISE EXCEPTION 'invalid_agreement' USING ERRCODE = '22023';
    END IF;
    IF q.quantity IS NULL OR q.quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
    END IF;
    -- La cuenta autenticada es la fuente del correo técnico del pedido; no es una opción de contacto.
    SELECT email INTO v_email FROM auth.users WHERE id = q.buyer_id;
    IF v_email IS NULL THEN
      RAISE EXCEPTION 'buyer_account_unavailable' USING ERRCODE = '22023';
    END IF;
    IF v_order_id IS NOT NULL THEN
      RAISE EXCEPTION 'quotation_order_already_exists' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO p FROM public.user_products WHERE id = q.product_id;
    INSERT INTO public.orders (buyer_id, seller_id, product_id, product_name, product_image,
      quantity, unit_price, total_price, buyer_name, buyer_email, shipping_address,
      status, origin, quotation_id, is_read_seller, is_read_buyer, unit, currency,
      category, origin_country, maturity, packaging_type, packaging_size, certifications, incoterm)
    VALUES (q.buyer_id, q.seller_id, q.product_id, q.product_title, q.product_image,
      q.quantity, p_unit_price, round(p_unit_price * q.quantity, 2), q.buyer_name, v_email,
      concat_ws(', ', NULLIF(q.destination_location, ''), q.destination_country),
      'Pendiente', 'quotation', q.id, false, false,
      COALESCE(q.quantity_unit, CASE WHEN q.container_size IS NOT NULL THEN 'contenedor' ELSE 'kg' END), p_currency,
      p.category, p.country, p.maturity, p.packaging, p.packaging_size::text, p.certifications::text, q.incoterm)
    RETURNING id INTO v_order_id;

    UPDATE public.quotations SET status = p_status, agreed_unit_price = p_unit_price,
      agreed_currency = p_currency WHERE id = q.id;
  ELSE
    UPDATE public.quotations SET status = p_status WHERE id = q.id;
  END IF;
  RETURN jsonb_build_object('status', p_status, 'orderId', v_order_id,
    'unitPrice', CASE WHEN p_status = 'accepted' THEN p_unit_price END,
    'currency', CASE WHEN p_status = 'accepted' THEN p_currency END);
END;
$$;

-- Solo la API, que comprueba la sesión y el vendedor, puede ejecutar esta operación.
REVOKE ALL ON FUNCTION public.decide_quotation(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decide_quotation(uuid, uuid, text, numeric, text) TO service_role;

COMMIT;
