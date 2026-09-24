CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  others_marks INTEGER NOT NULL CHECK (others_marks BETWEEN 0 AND 20),
  class VARCHAR(100),
  test_grade VARCHAR(10) NOT NULL
    CHECK (test_grade IN ('Kyu 1','Kyu 2','Kyu 3','Kyu 4','Kyu 5','Kyu 6','Kyu 7')),
  created_at TIMESTAMP DEFAULT now()
);

-- Bring a database created before this migration up to the current schema
ALTER TABLE students DROP COLUMN IF EXISTS phone;
ALTER TABLE students ADD COLUMN IF NOT EXISTS others_marks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ALTER COLUMN others_marks DROP DEFAULT;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_others_marks_check;
ALTER TABLE students ADD CONSTRAINT students_others_marks_check CHECK (others_marks BETWEEN 0 AND 20);
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_test_grade_check;
ALTER TABLE students ADD CONSTRAINT students_test_grade_check
  CHECK (test_grade IN ('Kyu 1','Kyu 2','Kyu 3','Kyu 4','Kyu 5','Kyu 6','Kyu 7'));

CREATE TABLE IF NOT EXISTS marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  ex_basics_comb INTEGER,
  kata INTEGER,
  others INTEGER,
  ex_saved BOOLEAN DEFAULT false,
  kata_saved BOOLEAN DEFAULT false,
  others_saved BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyu_locks (
  id SERIAL PRIMARY KEY,
  kyu VARCHAR(10) UNIQUE NOT NULL,
  locked_by VARCHAR(100),
  locked_at TIMESTAMP DEFAULT now()
);
