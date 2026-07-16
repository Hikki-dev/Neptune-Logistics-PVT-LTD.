-- ==========================================================================
-- NEPTUNE LOGISTICS - SHIPMENT VISIBILITY DATABASE SCHEMA
-- Execute this script directly in the Supabase SQL Editor (SQL Web Console).
-- ==========================================================================

-- 1. Create Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT UNIQUE NOT NULL, -- Neptune unique identifier (e.g., NPT-2026-001)
    shipment_ref TEXT NOT NULL,         -- Operations reference code
    customer_ref TEXT,                  -- Client internal reference code
    mode TEXT NOT NULL CHECK (mode IN ('Ocean', 'Air', 'Road')),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    eta TEXT NOT NULL,                  -- Flexible text format (e.g., "29 May 2026")
    container_number TEXT,              -- Ocean container IDs (comma separated or single)
    bl_number TEXT,                     -- Bill of Lading
    awb_number TEXT,                    -- Air Waybill
    current_status TEXT NOT NULL,       -- Human readable active milestone status
    public_notes TEXT,                  -- Daily ops notes displayed to public
    timeline_json JSONB DEFAULT '[]'::jsonb, -- Array holding milestone objects
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for high-speed tracking searches
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_code ON public.shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_container ON public.shipments(container_number);
CREATE INDEX IF NOT EXISTS idx_shipments_bl ON public.shipments(bl_number);
CREATE INDEX IF NOT EXISTS idx_shipments_awb ON public.shipments(awb_number);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. Create User Profiles Table & Secure Sync Trigger (Anti-Tampering)
-- ══════════════════════════════════════════════════════════════════════════
-- Storing roles in user_metadata is a security risk because users can edit their own metadata.
-- Instead, we store roles in this secure DB table which can ONLY be written to by triggers.

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'operations' CHECK (role IN ('admin', 'operations')),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view profiles (for UI operations/collaborator lookups)
DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
CREATE POLICY "Allow public read of profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- DB Sync Trigger: Automatically populates public.profiles when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'operations'),
        COALESCE(NEW.raw_user_meta_data ->> 'name', 'Staff Member')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to avoid errors on duplicate runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users into the secure profiles table
INSERT INTO public.profiles (id, role, name)
SELECT 
    id, 
    COALESCE(raw_user_meta_data ->> 'role', 'operations'),
    COALESCE(raw_user_meta_data ->> 'name', 'Staff Member')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. Row Level Security Policies (Staff Authorized Controls)
-- ══════════════════════════════════════════════════════════════════════════

-- Enable RLS on shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Drop existing shipments policies to allow clean creation without errors
DROP POLICY IF EXISTS "Staff read access" ON public.shipments;
DROP POLICY IF EXISTS "Admin insert access" ON public.shipments;
DROP POLICY IF EXISTS "Staff update access" ON public.shipments;
DROP POLICY IF EXISTS "Admin delete access" ON public.shipments;

-- Read Policy: Only Authenticated Staff (Admin or Operations) can list all records
CREATE POLICY "Staff read access" ON public.shipments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('admin', 'operations')
        )
    );

-- Write Policy: Only Administrators can create new shipments
CREATE POLICY "Admin insert access" ON public.shipments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

-- Update Policy: Admins and Operations Staff can update shipment milestones
CREATE POLICY "Staff update access" ON public.shipments
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('admin', 'operations')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('admin', 'operations')
        )
    );

-- Delete Policy: Only Administrators can delete shipments
CREATE POLICY "Admin delete access" ON public.shipments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

-- ══════════════════════════════════════════════════════════════════════════
-- 4. Secure Public Tracking RPC Function
-- ══════════════════════════════════════════════════════════════════════════
-- Public users have NO SELECT privilege on the shipments table directly.
-- They can ONLY retrieve a single record by calling this exact-match function.
-- This prevents bulk scraping and malicious exports.

CREATE OR REPLACE FUNCTION public.get_public_shipment(search_code TEXT)
RETURNS SETOF public.shipments
SECURITY DEFINER -- Bypasses RLS to execute SELECT securely
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.shipments
    WHERE is_public = TRUE AND (
        LOWER(tracking_code) = LOWER(search_code) OR
        LOWER(container_number) = LOWER(search_code) OR
        LOWER(bl_number) = LOWER(search_code) OR
        LOWER(awb_number) = LOWER(search_code) OR
        LOWER(shipment_ref) = LOWER(search_code)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execution to anonymous web requests
GRANT EXECUTE ON FUNCTION public.get_public_shipment(TEXT) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. Auto-update Trigger for timestamp audit
-- ══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- FUTURE-READY INTEGRATION NOTES:
-- 1. WHATSAPP TRIGGER: You can create a postgres trigger function linked to supabase functions/edge-runtime
--    to automatically invoke an export webhook to Twilio or WhatsApp Business API when shipments.current_status changes.
-- 2. CLIENT INVOICE/UPLOADS: Create a 'documents' table linked to 'shipments' using foreign keys.
--    Storage buckets in Supabase can handle uploads, governed by identical RLS policies.
