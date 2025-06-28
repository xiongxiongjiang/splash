"""
Unit tests for server endpoints without database dependency
"""
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import pytest
from datetime import datetime

# Mock the database module before importing server
with patch('server.init_db', new_callable=AsyncMock):
    with patch('server.seed_initial_data', new_callable=AsyncMock):
        with patch('server.SupabaseSession') as mock_session:
            # Mock the session context manager
            mock_session_instance = AsyncMock()
            mock_session_instance.__aenter__ = AsyncMock(return_value=mock_session_instance)
            mock_session_instance.__aexit__ = AsyncMock(return_value=None)
            mock_session.return_value = mock_session_instance
            
            from server import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint - no DB required"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "mcp_ready" in data


def test_root_endpoint():
    """Test root endpoint - no DB required"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "status" in data
    assert data["status"] == "running"
    assert "features" in data
    assert isinstance(data["features"], list)


@pytest.mark.asyncio
@patch('server.get_database_stats')
async def test_stats_endpoint_mocked(mock_get_stats):
    """Test stats endpoint with mocked database"""
    mock_get_stats.return_value = {
        "total_resumes": 10,
        "total_users": 5,
        "average_experience_years": 5.5
    }
    
    response = client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_resumes"] == 10
    assert data["total_users"] == 5
    assert data["average_experience_years"] == 5.5


@pytest.mark.asyncio
@patch('server.get_all_resumes')
async def test_search_resumes_mocked(mock_get_resumes):
    """Test resume search with mocked database"""
    # Mock resume data
    mock_resume = MagicMock()
    mock_resume.id = 1
    mock_resume.name = "Test User"
    mock_resume.email = "test@example.com"
    mock_resume.title = "Software Engineer"
    mock_resume.experience_years = 5
    mock_resume.skills = ["Python", "FastAPI"]
    mock_resume.education = "BS Computer Science"
    mock_resume.summary = "Test summary"
    mock_resume.phone = "555-1234"
    mock_resume.user_id = None
    mock_resume.created_at = datetime.now()
    
    mock_get_resumes.return_value = [mock_resume]
    
    with patch('server.get_database_stats') as mock_stats:
        mock_stats.return_value = {"total_resumes": 1, "total_users": 1, "average_experience_years": 5.0}
        
        response = client.get("/resumes")
        assert response.status_code == 200
        data = response.json()
        assert "resumes" in data
        assert "total_in_db" in data
        assert "returned" in data
        assert data["returned"] == 1


@pytest.mark.asyncio
@patch('server.add_to_waitlist')
@patch('server.subscribe_to_klaviyo_from_waitlist')
async def test_waitlist_endpoint(mock_klaviyo, mock_add_waitlist):
    """Test waitlist endpoint with mocked services"""
    # Mock waitlist entry
    mock_waitlist = MagicMock()
    mock_waitlist.email = "test@example.com"
    mock_waitlist.info = {}
    mock_waitlist.created_at = datetime.now()
    mock_waitlist.updated_at = datetime.now()
    
    mock_add_waitlist.return_value = mock_waitlist
    mock_klaviyo.return_value = None
    
    response = client.post("/waitlist", json={"email": "test@example.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_unauthorized_endpoints():
    """Test that protected endpoints require authentication"""
    # These should return 403 without authentication (forbidden access)
    protected_endpoints = [
        "/me",
        "/my-resumes",
        "/users/by-email/test@example.com"
    ]
    
    for endpoint in protected_endpoints:
        response = client.get(endpoint)
        assert response.status_code == 403, f"Endpoint {endpoint} should require authentication"


def test_create_resume_unauthorized():
    """Test that creating resume requires authentication"""
    response = client.post("/resumes", json={
        "name": "Test User",
        "email": "test@example.com",
        "title": "Engineer"
    })
    assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v"])