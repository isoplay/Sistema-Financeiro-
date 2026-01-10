#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / 'backend'))

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).parent / 'backend' / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

print("🔍 Testing Supabase Connection")
print("=" * 40)
print(f"Supabase URL: {SUPABASE_URL}")
print(f"Service Key: {SUPABASE_SERVICE_KEY[:20]}..." if SUPABASE_SERVICE_KEY else "Service Key: NOT FOUND")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase environment variables!")
    sys.exit(1)

try:
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase client created successfully")
    
    # Test basic connection by trying to list tables
    try:
        # Try to get users table info (this should work with service key)
        response = supabase.table('users').select('*').limit(1).execute()
        print(f"✅ Successfully connected to Supabase database")
        print(f"   Users table accessible: {len(response.data) >= 0}")
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
    
    # Test auth functionality
    try:
        # This should fail with service key (service keys can't be used for auth.getUser)
        user = supabase.auth.get_user("fake_token")
        print("⚠️  Auth test with fake token succeeded (unexpected)")
    except Exception as e:
        print(f"✅ Auth properly rejects invalid tokens: {str(e)}")
        
except Exception as e:
    print(f"❌ Failed to create Supabase client: {str(e)}")
    sys.exit(1)

print("\n📋 Supabase Connection Test Complete")