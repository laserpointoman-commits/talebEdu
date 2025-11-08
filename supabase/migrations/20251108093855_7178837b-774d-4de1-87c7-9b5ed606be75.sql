-- Fix Security Definer View issue
-- The available_contacts view needs to be set to security_invoker to run with 
-- the permissions of the querying user rather than the view creator

ALTER VIEW public.available_contacts SET (security_invoker = true);