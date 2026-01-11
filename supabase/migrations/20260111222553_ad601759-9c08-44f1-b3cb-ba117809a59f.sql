-- Add class_id column to students table to link students to classes
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);

-- Update classes table to track room and capacity
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 30;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2024-2025';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description TEXT;