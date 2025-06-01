from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_get_all_resumes():
    response = client.get("/resumes")
    assert response.status_code == 200
    data = response.json()
    assert "resumes" in data
    assert "total_in_db" in data
    assert len(data["resumes"]) == 5  # We have 5 resumes in our test data

def test_get_resume_by_id():
    # Test existing resume
    response = client.get("/resumes/1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["resume"]["id"] == 1
    assert data["resume"]["name"] == "John Doe"

    # Test non-existing resume
    response = client.get("/resumes/999")
    assert response.status_code == 404

def test_search_by_skill():
    response = client.get("/resumes/search/skills?skill=Python")
    assert response.status_code == 200
    data = response.json()
    assert data["skill_searched"] == "Python"
    assert "resumes" in data
    assert "count" in data
    assert data["count"] == 3  # Python appears in 3 resumes

def test_get_stats():
    response = client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_resumes"] == 5
    assert "average_experience_years" in data
    assert "most_common_skills" in data
    assert "unique_skills" in data

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Resume Management Server"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "services" in data 