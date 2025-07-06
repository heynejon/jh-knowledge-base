#!/usr/bin/env python3
"""
Test MongoDB Atlas TLS version support
This tests what TLS versions Atlas actually accepts
"""

import os
import ssl
import socket
import sys
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

def test_tls_versions():
    """Test different TLS versions against MongoDB Atlas"""
    print("=== TESTING MONGODB ATLAS TLS VERSION SUPPORT ===")
    
    mongodb_url = os.getenv("MONGODB_URL", "")
    if not mongodb_url or not mongodb_url.startswith("mongodb+srv://"):
        print("❌ MongoDB Atlas URL not found")
        return
    
    # Extract hostname from mongodb+srv://user:pass@cluster.domain/db
    try:
        # Remove mongodb+srv:// and extract domain
        url_part = mongodb_url.replace("mongodb+srv://", "")
        domain = url_part.split("@")[1].split("/")[0]
        print(f"Testing TLS versions for: {domain}")
        
        # Test DNS resolution first
        import dns.resolver
        srv_records = dns.resolver.resolve(f"_mongodb._tcp.{domain}", 'SRV')
        server_addresses = [str(srv.target).rstrip('.') for srv in srv_records]
        print(f"MongoDB servers: {server_addresses}")
        
        # Test each TLS version against the first server
        if server_addresses:
            server = server_addresses[0]
            port = 27017
            
            tls_versions = [
                ("TLS 1.0", ssl.TLSVersion.TLSv1),
                ("TLS 1.1", ssl.TLSVersion.TLSv1_1), 
                ("TLS 1.2", ssl.TLSVersion.TLSv1_2),
                ("TLS 1.3", ssl.TLSVersion.TLSv1_3)
            ]
            
            results = {}
            
            for version_name, tls_version in tls_versions:
                try:
                    print(f"\nTesting {version_name}...")
                    
                    # Create SSL context for specific TLS version
                    context = ssl.create_default_context()
                    context.minimum_version = tls_version
                    context.maximum_version = tls_version
                    context.check_hostname = False
                    context.verify_mode = ssl.CERT_NONE
                    
                    # Try to connect
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(10)
                    
                    with context.wrap_socket(sock, server_hostname=server) as ssock:
                        ssock.connect((server, port))
                        cipher = ssock.cipher()
                        version = ssock.version()
                        print(f"  ✅ {version_name}: SUCCESS - Negotiated {version}")
                        print(f"     Cipher: {cipher[0] if cipher else 'Unknown'}")
                        results[version_name] = {"status": "SUCCESS", "negotiated": version, "cipher": cipher[0] if cipher else "Unknown"}
                        
                except Exception as e:
                    print(f"  ❌ {version_name}: FAILED - {str(e)}")
                    results[version_name] = {"status": "FAILED", "error": str(e)}
            
            print(f"\n=== TLS VERSION SUPPORT SUMMARY ===")
            for version, result in results.items():
                if result["status"] == "SUCCESS":
                    print(f"✅ {version}: {result['negotiated']} ({result['cipher']})")
                else:
                    print(f"❌ {version}: {result['error']}")
                    
            return results
            
    except Exception as e:
        print(f"❌ TLS version test failed: {str(e)}")
        return None

def test_openssl_info():
    """Show local OpenSSL information"""
    print(f"\n=== LOCAL OPENSSL INFORMATION ===")
    print(f"Python version: {sys.version}")
    print(f"OpenSSL version: {ssl.OPENSSL_VERSION}")
    print(f"Supported TLS versions: {[v.name for v in ssl.TLSVersion]}")
    
    # Test what TLS versions this OpenSSL supports
    print(f"\nTesting local TLS version support:")
    for version in [ssl.TLSVersion.TLSv1, ssl.TLSVersion.TLSv1_1, ssl.TLSVersion.TLSv1_2, ssl.TLSVersion.TLSv1_3]:
        try:
            context = ssl.create_default_context()
            context.minimum_version = version
            context.maximum_version = version
            print(f"  ✅ {version.name}: Supported")
        except Exception as e:
            print(f"  ❌ {version.name}: {str(e)}")

if __name__ == "__main__":
    test_openssl_info()
    atlas_results = test_tls_versions()
    
    if atlas_results:
        print(f"\n=== ANALYSIS ===")
        
        # Check if TLS 1.2 works
        tls12_works = atlas_results.get("TLS 1.2", {}).get("status") == "SUCCESS"
        tls13_works = atlas_results.get("TLS 1.3", {}).get("status") == "SUCCESS"
        
        if tls12_works and tls13_works:
            print("✅ Atlas supports both TLS 1.2 and 1.3 - TLS version is not the issue")
        elif tls12_works:
            print("⚠️  Atlas supports TLS 1.2 but not 1.3 - May indicate older configuration")
        elif tls13_works:
            print("⚠️  Atlas only supports TLS 1.3 - This could be the compatibility issue!")
        else:
            print("❌ Atlas doesn't support TLS 1.2 or 1.3 - Network/DNS issue")
            
        print("\nThis helps us understand if the issue is TLS version compatibility")
        print("or something else in the SSL/TLS negotiation process.")