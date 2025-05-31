import pytest
import httpx
from server import app, mcp
from fastmcp import Client

# FastAPI REST API Tests
@pytest.fixture
def rest_client():
    return httpx.AsyncClient(app=app, base_url="http://test")

@pytest.mark.asyncio
async def test_root_endpoint(rest_client):
    """Test that the root endpoint returns service information"""
    response = await rest_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert "rest_api" in data["services"]
    assert "mcp_server" in data["services"]

@pytest.mark.asyncio
async def test_get_resumes_rest_api(rest_client):
    """Test that the REST API /resumes endpoint returns all resumes"""
    response = await rest_client.get("/resumes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3  # We have 3 sample resumes
    assert data[0]["name"] == "John Doe"
    assert data[1]["name"] == "Jane Smith"
    assert data[2]["name"] == "Mike Johnson"

@pytest.mark.asyncio
async def test_get_resumes_with_limit_rest_api(rest_client):
    """Test that the REST API limit parameter works correctly"""
    response = await rest_client.get("/resumes?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "John Doe"
    assert data[1]["name"] == "Jane Smith"

@pytest.mark.asyncio
async def test_get_resume_by_id_rest_api(rest_client):
    """Test that the REST API can get a specific resume by ID"""
    response = await rest_client.get("/resumes/1")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["id"] == 1

@pytest.mark.asyncio
async def test_get_resume_by_invalid_id_rest_api(rest_client):
    """Test that the REST API handles invalid resume IDs"""
    response = await rest_client.get("/resumes/999")
    assert response.status_code == 200
    data = response.json()
    assert "error" in data

# MCP Tests (testing the mounted MCP server)
@pytest.fixture
def mcp_client():
    """Client for testing MCP via the mounted endpoint"""
    return Client("http://test/mcp-server/mcp")

@pytest.mark.asyncio
async def test_get_all_resumes_mcp_tool(mcp_client):
    """Test that the MCP get_all_resumes tool returns all resumes"""
    async with mcp_client:
        response = await mcp_client.call_tool("get_all_resumes", {})
        results = response.content
        assert len(results) == 3
        assert results[0]["name"] == "John Doe"
        
@pytest.mark.asyncio
async def test_get_all_resumes_with_limit_mcp_tool(mcp_client):
    """Test that the MCP get_all_resumes tool respects limit parameter"""
    async with mcp_client:
        response = await mcp_client.call_tool("get_all_resumes", {"limit": 2})
        results = response.content
        assert len(results) == 2
        assert results[0]["name"] == "John Doe"
        assert results[1]["name"] == "Jane Smith"

@pytest.mark.asyncio
async def test_get_resume_by_id_mcp_tool(mcp_client):
    """Test that the MCP can get a specific resume by ID"""
    async with mcp_client:
        response = await mcp_client.call_tool("get_resume_by_id_mcp", {"resume_id": 1})
        data = response.content
        assert data["name"] == "John Doe"
        assert data["id"] == 1

@pytest.mark.asyncio
async def test_search_resumes_by_skill_mcp_tool(mcp_client):
    """Test that the MCP search tool works correctly"""
    async with mcp_client:
        response = await mcp_client.call_tool("search_resumes_by_skill", {"skill": "Python"})
        results = response.content
        assert len(results) == 1  # Only John Doe has Python skill
        assert results[0]["name"] == "John Doe"

@pytest.mark.asyncio
async def test_get_resume_count_mcp_tool(mcp_client):
    """Test that the MCP resume count tool works correctly"""
    async with mcp_client:
        response = await mcp_client.call_tool("get_resume_count", {})
        count = response.content
        assert count == 3

# Direct MCP Tests (testing the MCP server object directly)
@pytest.fixture
def direct_mcp_client():
    """Client for testing MCP server directly (not via HTTP mount)"""
    return Client(mcp)

@pytest.mark.asyncio
async def test_direct_mcp_search_tool(direct_mcp_client):
    """Test MCP tools directly without HTTP layer"""
    async with direct_mcp_client:
        response = await direct_mcp_client.call_tool("search_resumes_by_skill", {"skill": "Figma"})
        results = response.content
        assert len(results) == 2  # Jane Smith and Mike Johnson have Figma skill
        names = [resume["name"] for resume in results]
        assert "Jane Smith" in names
        assert "Mike Johnson" in names 