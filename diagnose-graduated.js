// Quick diagnostic to check Graduated class creation
// Run with: node diagnose-graduated.js

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const token = process.argv[2];
const schoolId = process.argv[3] || '4ba487ae-16c8-4403-a6f4-5a0241cbee04';

if (!token) {
  console.log('Usage: node diagnose-graduated.js <token> [schoolId]');
  console.log('Example: node diagnose-graduated.js eyJhbGc... 4ba487ae-16c8-4403-a6f4-5a0241cbee04');
  process.exit(1);
}

async function diagnose() {
  console.log('🔍 Diagnosing Graduated Class Issue...\n');
  
  // 1. Check what classes exist for this school
  console.log('1️⃣ Checking classes for school:', schoolId);
  try {
    const res = await fetch(`${API_BASE}/classes?schoolId=${schoolId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': schoolId,
      }
    });
    
    if (!res.ok) {
      console.log('❌ Failed to fetch classes:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response:', text);
      return;
    }
    
    const classes = await res.json();
    console.log(`Found ${classes.length} classes:\n`);
    
    classes.forEach(c => {
      const isGraduated = c.name.toLowerCase() === 'graduated';
      const icon = isGraduated ? '🎓' : '📚';
      console.log(`${icon} ${c.name} (${c.numericalName})`);
      console.log(`   ID: ${c.id}`);
      console.log(`   schoolId: ${c.schoolId || 'NULL ❌'}`);
      console.log(`   Description: ${c.description || 'N/A'}`);
      console.log();
    });
    
    const graduated = classes.find(c => c.name.toLowerCase() === 'graduated');
    
    if (graduated) {
      if (graduated.schoolId === schoolId && graduated.numericalName === 999) {
        console.log('✅ Graduated class is correctly configured!');
      } else {
        console.log('⚠️ Graduated class found but has issues:');
        if (graduated.schoolId !== schoolId) {
          console.log(`   - schoolId mismatch: ${graduated.schoolId} (expected ${schoolId})`);
        }
        if (graduated.numericalName !== 999) {
          console.log(`   - numericalName wrong: ${graduated.numericalName} (expected 999)`);
        }
      }
    } else {
      console.log('❌ No Graduated class found for this school');
      console.log('\n2️⃣ Attempting to create Graduated class...\n');
      
      const createRes = await fetch(`${API_BASE}/classes?schoolId=${schoolId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': schoolId,
        },
        body: JSON.stringify({
          name: 'Graduated',
          numericalName: 999,
          description: 'Graduated class',
          schoolId: schoolId
        })
      });
      
      if (!createRes.ok) {
        console.log('❌ Failed to create:', createRes.status, createRes.statusText);
        const text = await createRes.text();
        console.log('Response:', text);
        return;
      }
      
      const created = await createRes.json();
      console.log('✅ Created Graduated class:');
      console.log('   ID:', created.id);
      console.log('   Name:', created.name);
      console.log('   numericalName:', created.numericalName);
      console.log('   schoolId:', created.schoolId || 'NULL ❌');
      
      if (created.schoolId === schoolId) {
        console.log('\n✅ SUCCESS: schoolId was correctly saved!');
      } else {
        console.log('\n❌ FAILED: schoolId was NOT saved correctly!');
        console.log('   Expected:', schoolId);
        console.log('   Got:', created.schoolId);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

diagnose();
