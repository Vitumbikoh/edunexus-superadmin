#!/bin/bash
# Test script to verify Graduated class is created with schoolId
# Usage: ./test-graduated-curl.sh <token> [schoolId]

TOKEN="${1:-}"
SCHOOL_ID="${2:-4ba487ae-16c8-4403-a6f4-5a0241cbee04}"
API_BASE="${VITE_API_BASE_URL:-http://localhost:5000/api/v1}"

if [ -z "$TOKEN" ]; then
  echo "❌ Usage: ./test-graduated-curl.sh <token> [schoolId]"
  echo "   Example: ./test-graduated-curl.sh eyJhbGc... 4ba487ae-16c8-4403-a6f4-5a0241cbee04"
  exit 1
fi

echo "🧪 Testing Graduated Class Creation with schoolId..."
echo ""
echo "✓ Using school ID: $SCHOOL_ID"
echo "✓ Using API base: $API_BASE"
echo ""

# Step 1: List classes for this school
echo "Step 1: Checking for existing Graduated class..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $SCHOOL_ID" \
  "$API_BASE/classes?schoolId=$SCHOOL_ID")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Failed to list classes: HTTP $HTTP_STATUS"
  echo "$BODY"
  exit 1
fi

# Check if Graduated class exists
GRADUATED_CLASS=$(echo "$BODY" | grep -i "graduated")

if [ ! -z "$GRADUATED_CLASS" ]; then
  echo "✓ Graduated class found in response"
  SCHOOL_ID_IN_CLASS=$(echo "$BODY" | grep -A5 -i "graduated" | grep "schoolId" | head -1)
  
  if echo "$SCHOOL_ID_IN_CLASS" | grep -q "$SCHOOL_ID"; then
    echo "✅ TEST PASSED: Graduated class has correct schoolId!"
    echo "$SCHOOL_ID_IN_CLASS"
    exit 0
  else
    echo "❌ TEST FAILED: Graduated class schoolId mismatch!"
    echo "Expected: $SCHOOL_ID"
    echo "Response: $SCHOOL_ID_IN_CLASS"
    exit 1
  fi
fi

# Step 2: Create Graduated class
echo "⚠️  Graduated class not found. Creating..."
CREATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $SCHOOL_ID" \
  -d "{\"name\":\"Graduated\",\"numericalName\":999,\"description\":\"Graduated class\",\"schoolId\":\"$SCHOOL_ID\"}" \
  "$API_BASE/classes?schoolId=$SCHOOL_ID")

CREATE_HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$CREATE_HTTP_STATUS" != "201" ]; then
  echo "❌ Failed to create Graduated class: HTTP $CREATE_HTTP_STATUS"
  echo "$CREATE_BODY"
  exit 1
fi

echo "✓ Created response:"
echo "$CREATE_BODY"

# Step 3: Verify the created class has schoolId
CLASS_ID=$(echo "$CREATE_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CLASS_ID" ]; then
  echo "❌ Cannot extract class ID from response"
  exit 1
fi

echo ""
echo "Step 3: Verifying created class has schoolId..."
VERIFY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $SCHOOL_ID" \
  "$API_BASE/classes/$CLASS_ID")

VERIFY_HTTP_STATUS=$(echo "$VERIFY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$VERIFY_HTTP_STATUS" != "200" ]; then
  echo "❌ Failed to verify created class: HTTP $VERIFY_HTTP_STATUS"
  echo "$VERIFY_BODY"
  exit 1
fi

echo "✓ Verified response:"
echo "$VERIFY_BODY"

# Check schoolId in verified response
if echo "$VERIFY_BODY" | grep -q "\"schoolId\":\"$SCHOOL_ID\""; then
  if echo "$VERIFY_BODY" | grep -q "\"numericalName\":999"; then
    echo ""
    echo "✅ TEST PASSED: Graduated class created with correct schoolId and numericalName!"
    exit 0
  else
    echo ""
    echo "❌ TEST FAILED: numericalName is not 999"
    exit 1
  fi
else
  echo ""
  echo "❌ TEST FAILED: Graduated class missing or wrong schoolId!"
  echo "Expected schoolId: $SCHOOL_ID"
  exit 1
fi
