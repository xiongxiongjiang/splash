# WIP.

## Architecture

The application follows a linear workflow:
1. **Input Collection**: Resume upload, LinkedIn URL, Job Description
2. **AI Analysis**: JD analysis and recommendation generation
3. **Content Generation**: Personalized application materials
4. **Decision Making**: Automated outreach evaluation
5. **Outreach**: Personalized message generation and email sending

## API Endpoints

### Workflow Management

#### Start Workflow
```
POST /api/workflow/start
```
**Body:**
```json
{
  "resume_file": "File",
  "linkedin_url": "string",
  "jd_link": "string"
}
```
**Returns:**
```json
{
  "workflow_id": "string",
  "status": "string"
}
```

#### Get Workflow Status
```
GET /api/workflow/{workflow_id}/status
```
**Returns:**
```json
{
  "workflow_id": "string",
  "status": "string",
  "current_step": "string"
}
```

### File Operations

#### Upload Resume
```
POST /api/files/upload-resume
```
**Body:**
```json
{
  "file": "File"
}
```
**Returns:**
```json
{
  "file_id": "string",
  "filename": "string",
  "size": "integer"
}
```

#### Upload Job Description
```
POST /api/files/upload-jd
```
**Body:**
```json
{
  "file": "File"
}
```
**Returns:**
```json
{
  "file_id": "string",
  "filename": "string",
  "content_preview": "string"
}
```

#### Get File
```
GET /api/files/{file_id}
```
**Returns:**
```json
{
  "file_id": "string",
  "filename": "string",
  "content": "string",
  "metadata": "object"
}
```

### Job Description Processing

#### Analyze Job Description
```
POST /api/jd/analyze
```
**Body:**
```json
{
  "jd_file_id": "string",
  "resume_file_id": "string"
}
```
**Returns:**
```json
{
  "analysis_id": "string",
  "recommendations": "array",
  "key_requirements": "array"
}
```

#### Generate Content Based on JD
```
POST /api/jd/generate-content
```
**Body:**
```json
{
  "jd_analysis_id": "string",
  "content_type": "string"
}
```
**Returns:**
```json
{
  "content_id": "string",
  "generated_content": "string",
  "suggestions": "array"
}
```

#### Get JD Recommendations
```
GET /api/jd/{analysis_id}/recommendations
```
**Returns:**
```json
{
  "recommendations": "array",
  "match_score": "number",
  "gaps": "array"
}
```

### LinkedIn Operations

#### Save LinkedIn Profile
```
POST /api/linkedin/save-profile
```
**Body:**
```json
{
  "linkedin_url": "string",
  "position_id": "string"
}
```
**Returns:**
```json
{
  "profile_id": "string",
  "url": "string",
  "extracted_data": "object"
}
```

#### Get LinkedIn Profile Data
```
GET /api/linkedin/{profile_id}/data
```
**Returns:**
```json
{
  "profile_id": "string",
  "name": "string",
  "title": "string",
  "company": "string",
  "profile_data": "object"
}
```

### Position Management

#### Create Position
```
POST /api/positions/create
```
**Body:**
```json
{
  "jd_link": "string",
  "company": "string",
  "title": "string",
  "jd_analysis_id": "string"
}
```
**Returns:**
```json
{
  "position_id": "string",
  "title": "string",
  "company": "string",
  "created_at": "string"
}
```

#### List Positions
```
GET /api/positions
```
**Query Parameters:**
- `limit`: integer
- `offset`: integer
- `status`: string

**Returns:**
```json
{
  "positions": "array",
  "total": "integer",
  "page_info": "object"
}
```

#### Match Content to Position
```
PUT /api/positions/{position_id}/match-content
```
**Body:**
```json
{
  "content_id": "string",
  "linkedin_profile_id": "string"
}
```
**Returns:**
```json
{
  "position_id": "string",
  "match_score": "number",
  "content_matched": "boolean"
}
```

### Decision Making

#### Evaluate Outreach Worthiness
```
POST /api/decisions/evaluate-outreach
```
**Body:**
```json
{
  "position_id": "string",
  "match_score": "number",
  "additional_criteria": "object"
}
```
**Returns:**
```json
{
  "decision": "boolean",
  "confidence": "number",
  "reasoning": "string",
  "next_steps": "array"
}
```

### Outreach Generation

#### Generate Personalized Message
```
POST /api/outreach/generate-message
```
**Body:**
```json
{
  "position_id": "string",
  "linkedin_profile_id": "string",
  "recommendations_id": "string",
  "message_type": "string"
}
```
**Returns:**
```json
{
  "message_id": "string",
  "personalized_message": "string",
  "subject_line": "string",
  "send_ready": "boolean"
}
```

#### Send Email
```
POST /api/outreach/send-email
```
**Body:**
```json
{
  "message_id": "string",
  "recipient_email": "string",
  "send_immediately": "boolean"
}
```
**Returns:**
```json
{
  "email_id": "string",
  "sent": "boolean",
  "sent_at": "string",
  "delivery_status": "string"
}
```

### Dashboard Data

#### Get Dashboard Overview
```
GET /api/dashboard/overview
```
**Returns:**
```json
{
  "total_positions": "integer",
  "applications_sent": "integer",
  "responses": "integer",
  "success_rate": "number"
}
```

#### Get Recent Activity
```
GET /api/dashboard/recent-activity
```
**Query Parameters:**
- `days`: integer
- `limit`: integer

**Returns:**
```json
{
  "activities": "array",
  "summary": "object"
}
```

#### Get Positions by Status
```
GET /api/dashboard/positions-status
```
**Returns:**
```json
{
  "positions_by_status": "object",
  "pipeline_health": "object"
}
```

### Utility Endpoints

#### Health Check
```
GET /api/health
```
**Returns:**
```json
{
  "status": "string",
  "timestamp": "string",
  "version": "string"
}
```

#### Email Notification Settings
```
POST /api/notifications/email-settings
```
**Body:**
```json
{
  "email": "string",
  "notifications_enabled": "boolean",
  "frequency": "string"
}
```
**Returns:**
```json
{
  "settings_id": "string",
  "updated": "boolean"
}
```

## MCP Integration

This API uses `fastapi_mcp` to automatically convert all FastAPI endpoints into MCP (Model Context Protocol) tools. Each endpoint becomes an MCP function that can be called by MCP clients.

### Auto-Generated MCP Tool Names

The conversion follows this pattern:
- `POST /api/workflow/start` → `workflow_start`
- `POST /api/files/upload-resume` → `files_upload_resume`
- `POST /api/jd/analyze` → `jd_analyze`
- `POST /api/outreach/generate-message` → `outreach_generate_message`
- `GET /api/dashboard/overview` → `dashboard_overview`

### Benefits

1. **Single Codebase**: Write FastAPI endpoints once, get both HTTP API and MCP tools
2. **Automatic Documentation**: OpenAPI spec generation for HTTP, automatic MCP tool descriptions
3. **Type Safety**: Pydantic models ensure consistent data validation
4. **Easy Testing**: Test HTTP endpoints directly, MCP functionality comes for free

## Getting Started

1. Install dependencies:
```bash
pip install fastapi fastapi-mcp uvicorn
```

2. Run the application:
```bash
uvicorn main:app --reload
```

3. Access the API:
   - HTTP API: `http://localhost:8000`
   - OpenAPI docs: `http://localhost:8000/docs`
   - MCP integration: Use any MCP client to connect to the auto-generated tools

## Workflow Example

1. **Start**: Upload resume, provide LinkedIn URL and JD link
2. **Analysis**: AI analyzes JD against resume, generates recommendations
3. **Content**: Generate personalized application materials
4. **Decision**: Evaluate if position is worth pursuing
5. **Outreach**: Generate and send personalized messages
6. **Dashboard**: Track progress and success metrics

## Notes

- All file uploads should be handled securely with proper validation
- AI processing endpoints may have longer response times
- Email sending requires proper SMTP configuration
- Dashboard endpoints provide real-time analytics for decision making