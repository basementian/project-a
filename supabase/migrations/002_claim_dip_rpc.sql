-- Server-side claim with proximity validation
CREATE OR REPLACE FUNCTION claim_dip(
  p_dip_id UUID,
  p_user_lat FLOAT,
  p_user_lng FLOAT
)
RETURNS TABLE (
  id UUID,
  type dip_type,
  lat FLOAT,
  lng FLOAT,
  available_until TIMESTAMPTZ,
  price INTEGER,
  access_method access_method,
  rules TEXT,
  status dip_status,
  owner_id UUID,
  claimer_id UUID,
  access_instructions TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_dip RECORD;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT d.* INTO v_dip
  FROM public.dips d
  WHERE d.id = p_dip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dip not found';
  END IF;

  -- Must be active
  IF v_dip.status <> 'active' THEN
    RAISE EXCEPTION 'Dip is not available';
  END IF;

  -- Must not be expired
  IF v_dip.available_until <= now() THEN
    UPDATE public.dips SET status = 'expired' WHERE dips.id = p_dip_id;
    RAISE EXCEPTION 'Dip has expired';
  END IF;

  -- Cannot claim own dip
  IF v_dip.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot claim your own dip';
  END IF;

  -- Proximity check: must be within 200 meters
  IF ST_Distance(
    v_dip.location,
    ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
  ) > 200 THEN
    RAISE EXCEPTION 'Too far away. Must be within 200 meters.';
  END IF;

  -- All checks passed: claim it
  RETURN QUERY
  UPDATE public.dips
  SET status = 'claimed', claimer_id = auth.uid()
  WHERE dips.id = p_dip_id
  RETURNING
    dips.id,
    dips.type,
    ST_Y(dips.location::geometry),
    ST_X(dips.location::geometry),
    dips.available_until,
    dips.price,
    dips.access_method,
    dips.rules,
    dips.status,
    dips.owner_id,
    dips.claimer_id,
    dips.access_instructions,
    dips.created_at,
    dips.updated_at,
    dips.completed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire stale dips (can be called via cron or manually)
CREATE OR REPLACE FUNCTION expire_stale_dips()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.dips
  SET status = 'expired'
  WHERE status = 'active'
    AND available_until <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
