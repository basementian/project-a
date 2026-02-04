-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Enums
CREATE TYPE dip_type AS ENUM ('seat', 'desk', 'queue', 'charger', 'other');
CREATE TYPE dip_status AS ENUM ('active', 'claimed', 'expired', 'completed');
CREATE TYPE access_method AS ENUM ('code', 'qr', 'physical_handoff', 'meet_confirm');

-- Dips table
CREATE TABLE public.dips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type dip_type NOT NULL,
  location geography(POINT, 4326) NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  access_method access_method NOT NULL DEFAULT 'meet_confirm',
  rules TEXT,
  status dip_status NOT NULL DEFAULT 'active',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT max_duration CHECK (
    available_until <= created_at + INTERVAL '4 hours'
  )
);

-- Ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dip_id UUID NOT NULL REFERENCES public.dips(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dip_id, rater_id)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  display_name TEXT,
  avatar_url TEXT,
  average_rating NUMERIC(2,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports table (for disputes)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dip_id UUID NOT NULL REFERENCES public.dips(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_dips_status ON public.dips(status);
CREATE INDEX idx_dips_owner ON public.dips(owner_id);
CREATE INDEX idx_dips_claimer ON public.dips(claimer_id);
CREATE INDEX idx_dips_location ON public.dips USING GIST(location);
CREATE INDEX idx_dips_available_until ON public.dips(available_until);
CREATE INDEX idx_ratings_rated ON public.ratings(rated_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dips_updated_at
  BEFORE UPDATE ON public.dips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Find nearby active dips
CREATE OR REPLACE FUNCTION nearby_dips(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_meters FLOAT DEFAULT 2000
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
  completed_at TIMESTAMPTZ,
  distance FLOAT
) AS $$
  SELECT
    d.id, d.type,
    ST_Y(d.location::geometry) AS lat,
    ST_X(d.location::geometry) AS lng,
    d.available_until, d.price, d.access_method,
    d.rules, d.status, d.owner_id, d.claimer_id,
    d.access_instructions, d.created_at, d.updated_at, d.completed_at,
    ST_Distance(
      d.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance
  FROM public.dips d
  WHERE d.status = 'active'
    AND d.available_until > now()
    AND ST_DWithin(
      d.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance;
$$ LANGUAGE sql STABLE;

-- Check if user has active dip
CREATE OR REPLACE FUNCTION user_has_active_dip(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.dips
    WHERE owner_id = user_uuid
      AND status IN ('active', 'claimed')
  );
$$ LANGUAGE sql STABLE;

-- Update user rating average
CREATE OR REPLACE FUNCTION update_user_rating(target_user_id UUID)
RETURNS VOID AS $$
  UPDATE public.profiles
  SET
    average_rating = (SELECT COALESCE(AVG(score), 0) FROM public.ratings WHERE rated_id = target_user_id),
    total_ratings = (SELECT COUNT(*) FROM public.ratings WHERE rated_id = target_user_id)
  WHERE id = target_user_id;
$$ LANGUAGE sql;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, display_name)
  VALUES (NEW.id, NEW.phone, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dips;

-- Row Level Security
ALTER TABLE public.dips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Dips policies
CREATE POLICY "Anyone can view active dips or own dips"
  ON public.dips FOR SELECT TO authenticated
  USING (status = 'active' OR owner_id = auth.uid() OR claimer_id = auth.uid());

CREATE POLICY "Users can create dips"
  ON public.dips FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND NOT user_has_active_dip(auth.uid()));

CREATE POLICY "Owners can update own dips"
  ON public.dips FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR claimer_id = auth.uid());

CREATE POLICY "Owners can delete unclaimed dips"
  ON public.dips FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND status = 'active');

-- Ratings policies
CREATE POLICY "Anyone can read ratings"
  ON public.ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Participants can rate"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.dips
      WHERE id = dip_id AND status = 'completed'
        AND (owner_id = auth.uid() OR claimer_id = auth.uid())
    )
  );

-- Profiles policies
CREATE POLICY "Public profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Reports policies
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
