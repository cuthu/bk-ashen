
-- 1. Profiles Table: Stores user data and their role, linked to Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  -- Role-based access control is enforced here
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Security'))
);

-- 2. Classes Table: To organize students
CREATE TABLE classes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name TEXT NOT NULL,
  -- To support archiving and new school years
  school_year TEXT NOT NULL,
  UNIQUE(class_name, school_year)
);

-- 3. Students Table: The core student data
CREATE TABLE students (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name TEXT NOT NULL,
  class_id BIGINT REFERENCES classes(id),
  photo_url TEXT, -- URL to the image in Supabase Storage
  -- To manage student roll-over for new school years
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Late Arrivals Table: To log all late students
CREATE TABLE late_arrivals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id BIGINT NOT NULL REFERENCES students(id),
  -- Auditing: Who recorded the late arrival?
  recorded_by_profile_id UUID NOT NULL REFERENCES profiles(id),
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  notes TEXT,
  -- For editing/auditing
  last_edited_at TIMESTAMPTZ,
  last_edited_by_profile_id UUID REFERENCES profiles(id)
);

-- 5. Early Departures Table: To manage approved leaves
CREATE TABLE early_departures (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id BIGINT NOT NULL REFERENCES students(id),
  -- Auditing: Who approved this departure?
  created_by_profile_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('Approved', 'Checked-Out')),
  reason TEXT NOT NULL,
  planned_departure_time TIMESTAMPTZ NOT NULL,
  -- To be filled in by Security at the gate
  actual_departure_time TIMESTAMPTZ,
  checked_out_by_profile_id UUID REFERENCES profiles(id)
);
