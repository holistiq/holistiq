-- Migration to add washout period tracking functionality

-- Create washout_periods table
CREATE TABLE IF NOT EXISTS public.washout_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES public.supplements(id) ON DELETE SET NULL,
  supplement_name TEXT NOT NULL, -- Store name in case supplement record is deleted
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  expected_duration_days INTEGER,
  actual_duration_days INTEGER,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  reason TEXT, -- Why the washout period was started
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment to explain the table
COMMENT ON TABLE public.washout_periods IS 'Table for tracking periods when users stop taking supplements to establish baseline measurements';

-- Add comments on columns
COMMENT ON COLUMN public.washout_periods.supplement_id IS 'Reference to the supplement being washed out';
COMMENT ON COLUMN public.washout_periods.supplement_name IS 'Name of the supplement being washed out (for display if supplement record is deleted)';
COMMENT ON COLUMN public.washout_periods.start_date IS 'When the washout period began';
COMMENT ON COLUMN public.washout_periods.end_date IS 'When the washout period ended (null if still active)';
COMMENT ON COLUMN public.washout_periods.expected_duration_days IS 'Planned duration of the washout period in days';
COMMENT ON COLUMN public.washout_periods.actual_duration_days IS 'Actual duration of the washout period in days (calculated when completed)';
COMMENT ON COLUMN public.washout_periods.status IS 'Current status of the washout period';
COMMENT ON COLUMN public.washout_periods.reason IS 'Reason for starting the washout period';

-- Enable RLS
ALTER TABLE public.washout_periods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own washout periods"
  ON public.washout_periods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own washout periods"
  ON public.washout_periods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own washout periods"
  ON public.washout_periods
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own washout periods"
  ON public.washout_periods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS washout_periods_user_id_idx ON public.washout_periods (user_id);
CREATE INDEX IF NOT EXISTS washout_periods_supplement_id_idx ON public.washout_periods (supplement_id);
CREATE INDEX IF NOT EXISTS washout_periods_status_idx ON public.washout_periods (status);

-- Add washout_period_id to supplement_correlations table
ALTER TABLE public.supplement_correlations
ADD COLUMN IF NOT EXISTS considers_washout_period BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS washout_period_id UUID REFERENCES public.washout_periods(id) ON DELETE SET NULL;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.supplement_correlations.considers_washout_period IS 'Whether this correlation analysis takes washout periods into account';
COMMENT ON COLUMN public.supplement_correlations.washout_period_id IS 'Reference to a specific washout period used in this analysis';

-- Create function to update washout period status
CREATE OR REPLACE FUNCTION update_washout_period_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_date is set and status is still 'active', update to 'completed'
  IF NEW.end_date IS NOT NULL AND NEW.status = 'active' THEN
    NEW.status := 'completed';
    NEW.actual_duration_days := EXTRACT(DAY FROM (NEW.end_date - NEW.start_date));
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status when end_date is set
CREATE TRIGGER update_washout_period_status_trigger
BEFORE UPDATE ON public.washout_periods
FOR EACH ROW
EXECUTE FUNCTION update_washout_period_status();

-- Create function to check for active washout periods
CREATE OR REPLACE FUNCTION public.get_active_washout_periods(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  supplement_id UUID,
  supplement_name TEXT,
  start_date TIMESTAMPTZ,
  expected_duration_days INTEGER,
  days_elapsed INTEGER,
  status TEXT,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wp.id,
    wp.supplement_id,
    wp.supplement_name,
    wp.start_date,
    wp.expected_duration_days,
    EXTRACT(DAY FROM (now() - wp.start_date))::INTEGER AS days_elapsed,
    wp.status,
    wp.reason
  FROM 
    public.washout_periods wp
  WHERE 
    wp.user_id = p_user_id
    AND wp.status = 'active'
  ORDER BY 
    wp.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if a supplement is in washout
CREATE OR REPLACE FUNCTION public.is_supplement_in_washout(p_user_id UUID, p_supplement_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_in_washout BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.washout_periods
    WHERE user_id = p_user_id
      AND supplement_id = p_supplement_id
      AND status = 'active'
  ) INTO v_in_washout;
  
  RETURN v_in_washout;
END;
$$ LANGUAGE plpgsql;
