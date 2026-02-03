/**
 * Test script to verify Graduated class is created with schoolId
 * Run this after editing a school to verify the graduated class has schoolId
 * 
 * Usage: node test-graduated-class.js <token> [schoolId]
 */

import { createInterface } from 'readline';

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const DEFAULT_SCHOOL_ID = '4ba487ae-16c8-4403-a6f4-5a0241cbee04';

async function testGraduatedClassCreation() {
  console.log('🧪 Testing Graduated Class Creation with schoolId...\n');
  
  try {
    // Get token and schoolId from command line args
    const token = process.argv[2];
    const TEST_SCHOOL_ID = process.argv[3] || DEFAULT_SCHOOL_ID;
    
    if (!token) {
      console.error('❌ Usage: node test-graduated-class.js <token> [schoolId]');
      console.error('   Example: node test-graduated-class.js eyJhbGc... 4ba487ae-16c8-4403-a6f4-5a0241cbee04');
      return false;
    }
    
    console.log(`✓ Using school ID: ${TEST_SCHOOL_ID}`);
    console.log(`✓ Using API base: ${API_BASE}\n`);
    
    // Step 1: Check if graduated class exists for this school
    console.log('Step 1: Checking for existing Graduated class...');
    const listRes = await fetch(`${API_BASE}/classes?schoolId=${TEST_SCHOOL_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': TEST_SCHOOL_ID,
      }
    });
    
    if (!listRes.ok) {
      throw new Error(`Failed to list classes: ${listRes.status}`);
    }
    
    const classes = await listRes.json();
    const graduatedClass = classes.find(c => c.name.toLowerCase() === 'graduated');
    
    if (graduatedClass) {
      console.log('✓ Graduated class found:', graduatedClass);
      
      // Verify it has schoolId
      if (graduatedClass.schoolId === TEST_SCHOOL_ID) {
        console.log('✅ TEST PASSED: Graduated class has correct schoolId!');
        console.log(`   schoolId: ${graduatedClass.schoolId}`);
        console.log(`   numericalName: ${graduatedClass.numericalName}`);
        return true;
      } else {
        console.error('❌ TEST FAILED: Graduated class schoolId mismatch!');
        console.error(`   Expected: ${TEST_SCHOOL_ID}`);
        console.error(`   Got: ${graduatedClass.schoolId || 'NULL'}`);
        return false;
      }
    }
    
    // Step 2: If not found, create it
    console.log('⚠️  Graduated class not found. Creating...');
    
    const createRes = await fetch(`${API_BASE}/classes?schoolId=${TEST_SCHOOL_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': TEST_SCHOOL_ID,
      },
      body: JSON.stringify({
        name: 'Graduated',
        numericalName: 999,
        description: 'Graduated class',
        schoolId: TEST_SCHOOL_ID,
        school_id: TEST_SCHOOL_ID
      })
    });
    
    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Failed to create Graduated class: ${error}`);
    }
    
    const created = await createRes.json();
    console.log('✓ Created:', created);
    
    // Step 3: Verify the created class has schoolId
    console.log('\nStep 3: Verifying created class has schoolId...');
    
    const verifyRes = await fetch(`${API_BASE}/classes/${created.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': TEST_SCHOOL_ID,
      }
    });
    
    if (!verifyRes.ok) {
      throw new Error(`Failed to verify created class: ${verifyRes.status}`);
    }
    
    const verified = await verifyRes.json();
    console.log('✓ Verified:', verified);
    
    if (verified.schoolId === TEST_SCHOOL_ID && verified.numericalName === 999) {
      console.log('\n✅ TEST PASSED: Graduated class created with correct schoolId!');
      console.log(`   schoolId: ${verified.schoolId}`);
      console.log(`   numericalName: ${verified.numericalName}`);
      return true;
    } else {
      console.error('\n❌ TEST FAILED: Graduated class missing schoolId!');
      console.error(`   Expected schoolId: ${TEST_SCHOOL_ID}`);
      console.error(`   Got schoolId: ${verified.schoolId || 'NULL'}`);
      console.error(`   Expected numericalName: 999`);
      console.error(`   Got numericalName: ${verified.numericalName}`);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
    return false;
  }
}

// Run test
testGraduatedClassCreation().then(passed => {
  process.exit(passed ? 0 : 1);
});
