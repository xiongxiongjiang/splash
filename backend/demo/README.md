# Resume Chatbot Demo

A demonstration of the FastAPI + FastMCP resume server functionality with streaming HTTP support.

## Testing the API

### FastAPI Endpoints
1. Start the server:
   ```bash
   # From the backend directory
   cd ..
   python server.py
   ```

2. Access the Swagger UI:
   - Open your browser and navigate to `http://localhost:8000/docs`
   - This provides an interactive interface to test all available endpoints

### MCP Testing
1. Install the MCP Inspector:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Connect to the MCP endpoint:
   ```bash
   npx @modelcontextprotocol/inspector
   ```
   - Connect to: `http://localhost:8001/mcp`

## Current Features

- 🔄 Streaming HTTP support
- 📝 Resume management endpoints
- 🔍 MCP protocol integration
- 📊 Swagger documentation

## Technical Notes

- The server runs on port 8000 for FastAPI endpoints
- MCP endpoint is available on port 8001
- Currently supports streaming HTTP responses only

## Development
TODO this should be dockerized. Stay tuned