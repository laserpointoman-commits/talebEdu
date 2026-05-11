-- ============================================================
-- STEP 1: MULTI-TENANCY FOUNDATION (corrected order)
-- ============================================================

-- 1. Schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at timestamptz DEFAULT (now() + interval '30 days'),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. School settings
CREATE TABLE IF NOT EXISTS public.school_settings (
  school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  bracelet_replacement_price numeric NOT NULL DEFAULT 3.0,
  default_daily_allowance numeric NOT NULL DEFAULT 0,
  thawani_publishable_key text,
  thawani_secret_key text,
  commission_rate numeric NOT NULL DEFAULT 0.02,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER school_settings_updated_at BEFORE UPDATE ON public.school_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add super_admin to enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE public.user_role ADD VALUE 'super_admin';
  END IF;
END$$;

-- 4. Seed default school
INSERT INTO public.schools (id, name, name_ar, subscription_status, trial_ends_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'TalebEdu Demo School', 'مدرسة طالب التجريبية', 'active', now() + interval '10 years')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.school_settings (school_id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT (school_id) DO NOTHING;

-- 5. Add school_id to profiles FIRST (function depends on it)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE RESTRICT;
UPDATE public.profiles SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);

-- 6. Helper functions (now profiles.school_id exists)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role::text = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid DEFAULT auth.uid())
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- 7. Add school_id to 4 critical tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE RESTRICT;
UPDATE public.students SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);

ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE RESTRICT;
UPDATE public.buses SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_buses_school_id ON public.buses(school_id);

ALTER TABLE public.bus_routes ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE RESTRICT;
UPDATE public.bus_routes SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_bus_routes_school_id ON public.bus_routes(school_id);

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE RESTRICT;
UPDATE public.attendance_records SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance_records(school_id);

-- 8. Auto-fill trigger
CREATE OR REPLACE FUNCTION public.set_school_id_from_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    NEW.school_id := public.get_user_school_id(auth.uid());
    IF NEW.school_id IS NULL THEN
      NEW.school_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_school_id_students ON public.students;
CREATE TRIGGER set_school_id_students BEFORE INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();
DROP TRIGGER IF EXISTS set_school_id_buses ON public.buses;
CREATE TRIGGER set_school_id_buses BEFORE INSERT ON public.buses FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();
DROP TRIGGER IF EXISTS set_school_id_bus_routes ON public.bus_routes;
CREATE TRIGGER set_school_id_bus_routes BEFORE INSERT ON public.bus_routes FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();
DROP TRIGGER IF EXISTS set_school_id_attendance ON public.attendance_records;
CREATE TRIGGER set_school_id_attendance BEFORE INSERT ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_user();

-- 9. RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage schools" ON public.schools FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Users view their own school" ON public.schools FOR SELECT USING (id = public.get_user_school_id());
CREATE POLICY "Super admins manage school settings" ON public.school_settings FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Users view their school settings" ON public.school_settings FOR SELECT USING (school_id = public.get_user_school_id());
CREATE POLICY "School admins update their settings" ON public.school_settings FOR UPDATE USING (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'));