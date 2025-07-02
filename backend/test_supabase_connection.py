#!/usr/bin/env python3
"""
Test script to verify Supabase PostgreSQL connection
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_supabase_connection():
    """Test connection to Supabase PostgreSQL"""
    
    # Supabase connection string
    SUPABASE_DB_URL = "postgresql+asyncpg://postgres.osugovugrrthcqelvagj:SeedisnotGay88!@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        logger.info("Creating async engine for Supabase...")
        engine = create_async_engine(SUPABASE_DB_URL, echo=True)
        
        logger.info("Testing connection...")
        async with engine.begin() as conn:
            # Test basic connection
            result = await conn.execute(text("SELECT version()"))
            version = result.fetchone()
            logger.info(f"PostgreSQL version: {version[0]}")
            
            # Test listing tables
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            logger.info(f"Found {len(tables)} tables:")
            for table in tables:
                logger.info(f"  - {table[0]}")
        
        logger.info("✅ Supabase connection successful!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Connection failed: {e}")
        return False
    finally:
        if 'engine' in locals():
            await engine.dispose()

if __name__ == "__main__":
    success = asyncio.run(test_supabase_connection())
    if success:
        print("\n🎉 Supabase PostgreSQL connection is working!")
    else:
        print("\n💥 Supabase connection failed. Check credentials and network.")