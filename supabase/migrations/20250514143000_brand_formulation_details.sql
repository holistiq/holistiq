-- Migration to add brand and formulation details to supplements table

-- Add new columns to the supplements table
ALTER TABLE public.supplements
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS brand_reputation SMALLINT,
ADD COLUMN IF NOT EXISTS formulation_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS third_party_tested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certification VARCHAR(50);

-- Add comments on the new columns
COMMENT ON COLUMN public.supplements.manufacturer IS 'Company that manufactures the supplement';
COMMENT ON COLUMN public.supplements.brand IS 'Brand name of the supplement';
COMMENT ON COLUMN public.supplements.brand_reputation IS 'Rating of brand reputation (1-5)';
COMMENT ON COLUMN public.supplements.formulation_type IS 'Type of formulation (e.g., extended-release, liposomal)';
COMMENT ON COLUMN public.supplements.batch_number IS 'Batch or lot number from the supplement container';
COMMENT ON COLUMN public.supplements.expiration_date IS 'Expiration date of the supplement';
COMMENT ON COLUMN public.supplements.third_party_tested IS 'Whether the supplement has been third-party tested';
COMMENT ON COLUMN public.supplements.certification IS 'Certification standards met (e.g., USP, NSF, GMP)';

-- Update the table comment to reflect the new fields
COMMENT ON TABLE public.supplements IS 'Table for tracking supplement intake with structured dosage, timing information, and brand/formulation details';
