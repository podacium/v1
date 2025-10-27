import asyncio
import os
from app.generated.prisma import Prisma

async def test_prisma():
    print("🧪 Testing Prisma Python client...")
    
    prisma = Prisma()
    
    try:
        # Connect to database
        await prisma.connect()
        print("✅ Prisma connected successfully")
        
        # Test a simple query
        user_count = await prisma.user.count()
        print(f"📊 Users in database: {user_count}")
        
        # Test creating a user with correct field names
        print("🧪 Testing user creation...")
        try:
            user = await prisma.user.create({
                'data': {
                    'fullName': 'Test User',  # Use fullName instead of fullName
                    'email': 'test2@example.com',  # Use unique email
                    'passwordHash': 'test_hash',
                    'provider': 'EMAIL',
                    'role': 'STUDENT',
                    'acceptedTerms': True,
                    'subscribeNewsletter': False
                }
            })
            print(f"✅ User created: {user.id}")
            print(f"✅ User email: {user.email}")
            print(f"✅ User name: {user.fullName}")
            
            # Clean up
            await prisma.user.delete(where={'id': user.id})
            print("✅ Test user cleaned up")
            
        except Exception as e:
            print(f"❌ User creation failed: {e}")
            import traceback
            traceback.print_exc()
        
        await prisma.disconnect()
        print("✅ Prisma disconnected successfully")
        
    except Exception as e:
        print(f"❌ Prisma test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_prisma())