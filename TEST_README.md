# Graduated Class Creation Test

## Purpose
This test verifies that the "Graduated" class is created with the correct `schoolId` when editing or creating a school.

## Running the Test

### Prerequisites
1. Backend server running on port 5000
2. Admin frontend proxy on port 3000
3. Valid admin/superadmin JWT token
4. School ID to test with

### Get Your Token
1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage
3. Copy the value of `token` or `access_token`

### Run Test

#### Windows (PowerShell)
```powershell
cd schomas-admin
.\test-graduated.ps1 -Token "YOUR_TOKEN" -SchoolId "SCHOOL_ID"
```

**Example:**
```powershell
.\test-graduated.ps1 -Token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -SchoolId "4ba487ae-16c8-4403-a6f4-5a0241cbee04"
```

#### Linux/Mac (Bash)
```bash
cd schomas-admin
bash test-graduated-curl.sh YOUR_TOKEN SCHOOL_ID
```

**Example:**
```bash
bash test-graduated-curl.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." "4ba487ae-16c8-4403-a6f4-5a0241cbee04"
```

### Expected Result

✅ **Test Passes** if:
- Graduated class exists for the school
- `schoolId` matches the provided school ID  
- `numericalName` is 999

❌ **Test Fails** if:
- Graduated class `schoolId` is NULL
- Graduated class `schoolId` doesn't match
- Graduated class doesn't exist and cannot be created

## Verifying in Database

```sql
SELECT * FROM classes WHERE name = 'Graduated';
```

Should show:
- `schoolId`: not NULL, matches your school
- `numericalName`: 999
- `description`: 'Graduated class'

## Troubleshooting

### Test fails with "schoolId is NULL"
- Backend is not accepting schoolId from request body
- Check backend logs for DTO validation errors
- Verify backend DTO includes `schoolId` field

### Test fails with "Authentication failed"
- Token is invalid or expired
- Get fresh token from browser localStorage

### Test fails with "Cannot create class"
- Backend validation error
- Check if class name already exists
- Check backend server logs
