# Database Seeding

## Using the Seed File

The `.seed.sql` file contains sample data for development and testing. It creates:

- 5 sample users
- 5 sample profiles (V2 schema)
- 5 sample resumes (V2 schema)

## How to Run

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `.seed.sql`
4. Click "Run"

### Option 2: Command Line (if you have direct database access)
```bash
psql -h [your-host] -U [username] -d [database] -f .seed.sql
```

### Option 3: Using Supabase CLI
```bash
supabase db reset --with-seed
```

## Sample Data Included

The seed data creates profiles and resumes for:

1. **John Doe** - Senior Software Engineer
   - Skills: Python, JavaScript, React, FastAPI, PostgreSQL
   - Experience: 8 years

2. **Jane Smith** - Product Manager
   - Skills: Product Strategy, Agile, Data Analysis, SQL, Figma
   - Experience: 6 years

3. **Mike Johnson** - UX Designer
   - Skills: UI/UX Design, Figma, Adobe Creative Suite, User Research
   - Experience: 4 years

4. **Sarah Wilson** - Data Scientist
   - Skills: Python, Machine Learning, TensorFlow, SQL, Statistics
   - Experience: 5 years

5. **David Chen** - DevOps Engineer
   - Skills: AWS, Docker, Kubernetes, Terraform, Python, CI/CD
   - Experience: 7 years

## Data Format

All data uses the V2 schema format:
- Skills stored as `{"raw_skills": ["skill1", "skill2", ...]}`
- Education stored as `{"degrees": [{"degree": "...", "university": "...", "year": "..."}]}`
- Consistent field names (`years_experience`, `professional_summary`, etc.)

## Testing

After running the seed file, you can test the application with the sample users by:
1. Using their email addresses in the authentication flow
2. Viewing their profiles and resumes in the dashboard
3. Testing the statistics and skills display features

## Cleanup

To remove seed data, you can run:
```sql
DELETE FROM resumes_v2 WHERE profile_id IN (
  SELECT id FROM profiles_v2 WHERE email LIKE '%@email.com'
);
DELETE FROM profiles_v2 WHERE email LIKE '%@email.com';
DELETE FROM users WHERE email LIKE '%@email.com';
```