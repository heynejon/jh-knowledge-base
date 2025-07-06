#!/usr/bin/env python3
"""
Local MongoDB Atlas connection test
This replicates the exact same connection logic used on Heroku
"""

import os
import sys
import ssl
import certifi
import pymongo
import socket
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment():
    """Test local environment details"""
    print("=== LOCAL ENVIRONMENT TEST ===")
    
    env_info = {
        "python_version": sys.version,
        "ssl_version": ssl.OPENSSL_VERSION,
        "pymongo_version": pymongo.version,
        "certifi_location": certifi.where(),
        "mongodb_url_format": "mongodb+srv://" in os.getenv("MONGODB_URL", "")
    }
    
    print(f"Environment info: {env_info}")
    return env_info

def test_network_connectivity():
    """Test DNS resolution and TCP connectivity"""
    print("\n=== NETWORK CONNECTIVITY TEST ===")
    
    mongodb_url = os.getenv("MONGODB_URL", "")
    if not mongodb_url:
        print("ERROR: MONGODB_URL not found in environment")
        return False
        
    try:
        if "mongodb+srv://" in mongodb_url:
            # Extract domain from mongodb+srv://user:pass@cluster.domain/db
            domain = mongodb_url.split("@")[1].split("/")[0]
            print(f"Testing DNS resolution for: {domain}")
            
            # Test DNS resolution
            import dns.resolver
            srv_records = dns.resolver.resolve(f"_mongodb._tcp.{domain}", 'SRV')
            server_addresses = [str(srv.target).rstrip('.') for srv in srv_records]
            print(f"DNS SRV records found: {server_addresses}")
            
            # Test basic TCP connectivity to first server
            if server_addresses:
                first_server = server_addresses[0]
                port = 27017
                print(f"Testing TCP connection to {first_server}:{port}")
                
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((first_server, port))
                sock.close()
                
                print(f"TCP connectivity: {'Success' if result == 0 else f'Failed (code: {result})'}")
                return result == 0
            else:
                print("No SRV records found")
                return False
        else:
            print("Not using mongodb+srv:// scheme")
            return False
            
    except Exception as e:
        print(f"Network test failed: {str(e)}")
        return False

def test_mongodb_connection():
    """Test MongoDB Atlas connection using exact same logic as Heroku"""
    print("\n=== MONGODB CONNECTION TEST ===")
    
    mongodb_url = os.getenv("MONGODB_URL", "")
    database_name = os.getenv("DATABASE_NAME", "jh_knowledge_base")
    
    if not mongodb_url:
        print("ERROR: MONGODB_URL not found in environment")
        return False
    
    # Approach 1: Use explicit SSL context configuration (same as Heroku)
    try:
        print("Attempting MongoDB Atlas connection (Approach 1)...")
        print(f"Using MongoDB URL: {mongodb_url[:20]}...")
        
        # Create SSL context with specific MongoDB Atlas compatible settings
        ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        ssl_context.load_verify_locations(certifi.where())
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED
        ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
        
        client = MongoClient(
            mongodb_url,
            serverSelectionTimeoutMS=15000,
            socketTimeoutMS=15000,
            connectTimeoutMS=15000,
            tls=True,
            tlsCAFile=certifi.where(),
            ssl_context=ssl_context,
            retryWrites=True,
            w='majority'
        )
        
        # Test the connection
        print("Testing connection with ping...")
        client.admin.command('ping')
        db = client[database_name]
        print("✅ MongoDB Atlas connection successful (Approach 1)!")
        
        # Test basic operations
        print("Testing basic database operations...")
        test_collection = db.test_collection
        
        # Insert a test document
        test_doc = {"test": "local_connection", "timestamp": "2025-07-06"}
        result = test_collection.insert_one(test_doc)
        print(f"Insert result: {result.inserted_id}")
        
        # Find the document
        found_doc = test_collection.find_one({"_id": result.inserted_id})
        print(f"Found document: {found_doc}")
        
        # Clean up
        test_collection.delete_one({"_id": result.inserted_id})
        print("Test document cleaned up")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB Atlas connection failed (Approach 1): {str(e)}")
        
        # Approach 2: Try without cert validation (same as Heroku fallback)
        try:
            print("Attempting MongoDB Atlas connection (Approach 2 - no cert validation)...")
            
            client = MongoClient(
                mongodb_url,
                serverSelectionTimeoutMS=10000,
                socketTimeoutMS=10000,
                connectTimeoutMS=10000,
                tls=True,
                tlsInsecure=True,
                retryWrites=True
            )
            
            # Test the connection
            client.admin.command('ping')
            db = client[database_name]
            print("✅ MongoDB Atlas connection successful (Approach 2)!")
            
            client.close()
            return True
            
        except Exception as e2:
            print(f"❌ MongoDB Atlas connection failed (Approach 2): {str(e2)}")
            return False

def main():
    """Run all tests"""
    print("Local MongoDB Atlas Connection Test")
    print("=" * 50)
    
    # Check if we have MongoDB Atlas URL
    mongodb_url = os.getenv("MONGODB_URL", "")
    if not mongodb_url or not mongodb_url.startswith("mongodb+srv://"):
        print("❌ MongoDB Atlas URL not found in environment.")
        print("Please set the MONGODB_URL environment variable to your Atlas connection string.")
        print("You can get it from: heroku config:get MONGODB_URL --app jh-knowledge-base")
        print("\nExample:")
        print("export MONGODB_URL='mongodb+srv://username:password@cluster.mongodb.net/database'")
        return
    
    # Test environment
    env_info = test_environment()
    
    # Test network connectivity
    network_ok = test_network_connectivity()
    
    if not network_ok:
        print("\n❌ Network connectivity test failed. Check your internet connection.")
        return
    
    # Test MongoDB connection
    connection_ok = test_mongodb_connection()
    
    print("\n" + "=" * 50)
    if connection_ok:
        print("🎉 SUCCESS: MongoDB Atlas connection works locally!")
        print("This suggests the issue is Heroku-specific.")
        print("\nNext steps:")
        print("1. The same code works locally but fails on Heroku")
        print("2. This indicates a Heroku environment issue")
        print("3. Consider contacting Heroku support or MongoDB Atlas support")
        print("4. Alternative: Switch to Heroku Postgres for reliable persistence")
    else:
        print("❌ FAILURE: MongoDB Atlas connection failed locally too.")
        print("This suggests the issue is not Heroku-specific.")
        print("\nNext steps:")
        print("1. Check MongoDB Atlas network access settings")
        print("2. Verify the connection string is correct")
        print("3. Contact MongoDB Atlas support")
    
    print("\nEnvironment Summary:")
    for key, value in env_info.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    main()