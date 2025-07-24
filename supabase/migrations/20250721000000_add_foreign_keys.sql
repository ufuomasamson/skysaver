-- Add foreign key constraints to flights table
ALTER TABLE flights 
  ADD CONSTRAINT flights_airline_id_fkey 
  FOREIGN KEY (airline_id) 
  REFERENCES airlines(id) ON DELETE CASCADE;

ALTER TABLE flights 
  ADD CONSTRAINT flights_departure_location_id_fkey 
  FOREIGN KEY (departure_location_id) 
  REFERENCES locations(id) ON DELETE CASCADE;

ALTER TABLE flights 
  ADD CONSTRAINT flights_arrival_location_id_fkey 
  FOREIGN KEY (arrival_location_id) 
  REFERENCES locations(id) ON DELETE CASCADE;

-- Add passenger_name and tracking_number columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flights' AND column_name = 'passenger_name') THEN
    ALTER TABLE flights ADD COLUMN passenger_name VARCHAR(128);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flights' AND column_name = 'tracking_number') THEN
    ALTER TABLE flights ADD COLUMN tracking_number VARCHAR(32);
  END IF;
END $$;
