-- Migration to add structured dosage and timing fields to supplements table

-- Add new columns to the supplements table
ALTER TABLE public.supplements
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS unit VARCHAR(20),
ADD COLUMN IF NOT EXISTS frequency VARCHAR(50),
ADD COLUMN IF NOT EXISTS time_of_day VARCHAR(20),
ADD COLUMN IF NOT EXISTS with_food BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS schedule JSONB;

-- Add comment to explain the schema update
COMMENT ON TABLE public.supplements IS 'Table for tracking supplement intake with structured dosage and timing information';

-- Add comments on the new columns
COMMENT ON COLUMN public.supplements.amount IS 'Numeric value of the dosage (e.g., 500)';
COMMENT ON COLUMN public.supplements.unit IS 'Unit of measurement (e.g., mg, mcg, IU)';
COMMENT ON COLUMN public.supplements.frequency IS 'How often the supplement is taken (daily, twice-daily, weekly, etc.)';
COMMENT ON COLUMN public.supplements.time_of_day IS 'When the supplement is typically taken (morning, afternoon, evening, bedtime)';
COMMENT ON COLUMN public.supplements.with_food IS 'Whether the supplement should be taken with food';
COMMENT ON COLUMN public.supplements.schedule IS 'JSON object for more complex schedules (e.g., specific days of week)';