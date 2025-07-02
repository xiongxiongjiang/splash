-- Seed data for Splash Resume Management Platform
-- V2 Schema: users -> profiles_v2 -> resumes_v2

-- Clear existing data (optional - only for testing)
-- DELETE FROM resumes_v2;
-- DELETE FROM profiles_v2;
-- DELETE FROM users WHERE email LIKE '%@email.com';

-- Sample users
INSERT INTO users (supabase_id, email, name, role, created_at, last_seen) VALUES
  ('seed-user-1', 'john.doe@email.com', 'John Doe', 'user', NOW(), NOW()),
  ('seed-user-2', 'jane.smith@email.com', 'Jane Smith', 'user', NOW(), NOW()),
  ('seed-user-3', 'mike.johnson@email.com', 'Mike Johnson', 'user', NOW(), NOW()),
  ('seed-user-4', 'sarah.wilson@email.com', 'Sarah Wilson', 'user', NOW(), NOW()),
  ('seed-user-5', 'david.chen@email.com', 'David Chen', 'user', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Sample profiles (V2 schema)
INSERT INTO profiles_v2 (
  user_id, name, email, phone, location, professional_summary, 
  years_experience, skills, education, enhancement_status, 
  data_sources, created_at, updated_at
) VALUES
  (
    (SELECT id FROM users WHERE email = 'john.doe@email.com'),
    'John Doe',
    'john.doe@email.com',
    '(555) 123-4567',
    'San Francisco, CA',
    'Experienced full-stack developer with expertise in Python and modern web technologies.',
    8,
    '{"raw_skills": ["Python", "JavaScript", "React", "FastAPI", "PostgreSQL"]}',
    '{"degrees": [{"degree": "BS Computer Science", "university": "Stanford University", "year": "2015"}]}',
    'basic',
    '{"sources": ["seed_data"]}',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM users WHERE email = 'jane.smith@email.com'),
    'Jane Smith',
    'jane.smith@email.com',
    '(555) 987-6543',
    'New York, NY',
    'Results-driven product manager with proven track record of launching successful products.',
    6,
    '{"raw_skills": ["Product Strategy", "Agile", "Data Analysis", "SQL", "Figma"]}',
    '{"degrees": [{"degree": "MBA", "university": "Harvard Business School", "year": "2018"}]}',
    'basic',
    '{"sources": ["seed_data"]}',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM users WHERE email = 'mike.johnson@email.com'),
    'Mike Johnson',
    'mike.johnson@email.com',
    '(555) 456-7890',
    'Los Angeles, CA',
    'Creative UX designer focused on user-centered design and accessibility.',
    4,
    '{"raw_skills": ["UI/UX Design", "Figma", "Adobe Creative Suite", "User Research", "Prototyping"]}',
    '{"degrees": [{"degree": "BFA Design", "university": "Art Center College of Design", "year": "2019"}]}',
    'basic',
    '{"sources": ["seed_data"]}',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM users WHERE email = 'sarah.wilson@email.com'),
    'Sarah Wilson',
    'sarah.wilson@email.com',
    '(555) 321-9876',
    'Boston, MA',
    'Data scientist specializing in machine learning and predictive analytics.',
    5,
    '{"raw_skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics"]}',
    '{"degrees": [{"degree": "PhD Statistics", "university": "MIT", "year": "2020"}]}',
    'basic',
    '{"sources": ["seed_data"]}',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM users WHERE email = 'david.chen@email.com'),
    'David Chen',
    'david.chen@email.com',
    '(555) 654-3210',
    'Seattle, WA',
    'DevOps engineer with expertise in cloud infrastructure and automation.',
    7,
    '{"raw_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "CI/CD"]}',
    '{"degrees": [{"degree": "BS Computer Engineering", "university": "UC Berkeley", "year": "2016"}]}',
    'basic',
    '{"sources": ["seed_data"]}',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Sample resumes (V2 schema)
INSERT INTO resumes_v2 (
  profile_id, name, email, phone, professional_summary, 
  years_experience, skills, education, file_type, version, 
  is_active, created_at, updated_at
) VALUES
  (
    (SELECT id FROM profiles_v2 WHERE email = 'john.doe@email.com'),
    'John Doe',
    'john.doe@email.com',
    '(555) 123-4567',
    'Experienced full-stack developer with expertise in Python and modern web technologies.',
    8,
    '{"raw_skills": ["Python", "JavaScript", "React", "FastAPI", "PostgreSQL"]}',
    '{"degrees": [{"degree": "BS Computer Science", "university": "Stanford University", "year": "2015"}]}',
    'generated',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM profiles_v2 WHERE email = 'jane.smith@email.com'),
    'Jane Smith',
    'jane.smith@email.com',
    '(555) 987-6543',
    'Results-driven product manager with proven track record of launching successful products.',
    6,
    '{"raw_skills": ["Product Strategy", "Agile", "Data Analysis", "SQL", "Figma"]}',
    '{"degrees": [{"degree": "MBA", "university": "Harvard Business School", "year": "2018"}]}',
    'generated',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM profiles_v2 WHERE email = 'mike.johnson@email.com'),
    'Mike Johnson',
    'mike.johnson@email.com',
    '(555) 456-7890',
    'Creative UX designer focused on user-centered design and accessibility.',
    4,
    '{"raw_skills": ["UI/UX Design", "Figma", "Adobe Creative Suite", "User Research", "Prototyping"]}',
    '{"degrees": [{"degree": "BFA Design", "university": "Art Center College of Design", "year": "2019"}]}',
    'generated',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM profiles_v2 WHERE email = 'sarah.wilson@email.com'),
    'Sarah Wilson',
    'sarah.wilson@email.com',
    '(555) 321-9876',
    'Data scientist specializing in machine learning and predictive analytics.',
    5,
    '{"raw_skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics"]}',
    '{"degrees": [{"degree": "PhD Statistics", "university": "MIT", "year": "2020"}]}',
    'generated',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM profiles_v2 WHERE email = 'david.chen@email.com'),
    'David Chen',
    'david.chen@email.com',
    '(555) 654-3210',
    'DevOps engineer with expertise in cloud infrastructure and automation.',
    7,
    '{"raw_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "CI/CD"]}',
    '{"degrees": [{"degree": "BS Computer Engineering", "university": "UC Berkeley", "year": "2016"}]}',
    'generated',
    1,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;