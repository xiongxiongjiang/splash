# Resume Management API

## Overview

This document describes the Resume Management API endpoints for file upload and resume parsing. The system integrates with AWS S3 for secure file storage and Dify AI for intelligent resume analysis.

## Key Features

- **File Management**: Upload, delete, and manage files in AWS S3 with nanoid-generated unique filenames
- **Resume Parsing**: AI-powered resume analysis using Dify service with streaming responses
- **Secure Storage**: AWS S3 integration with proper error handling and access control
- **Real-time Processing**: Streaming API responses for better user experience during AI processing

---

## File Upload API

### Upload File to S3

```
POST /upload
```

**Description:** Upload a file to AWS S3 bucket. File name is automatically generated using nanoid for uniqueness.

**Body:** Multipart form data

- `file`: File (max 10MB)

**Content-Type:** `multipart/form-data`

**Returns:**

```json
{
  "success": true,
  "file_url": "https://bucket.s3.region.amazonaws.com/uploads/nanoid12.pdf",
  "s3_key": "uploads/nanoid12.pdf",
  "bucket": "bucket-name",
  "original_name": "resume.pdf",
  "uploaded_name": "nanoid12.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "folder": "uploads"
}
```

**Error Responses:**

- `413`: File too large (max 10MB) - `code: "FILE_TOO_LARGE"`
- `403`: Access denied to S3 bucket - `code: "S3_ACCESS_DENIED"`
- `500`: S3 upload failed - `code: "S3_UPLOAD_ERROR_*"`
- `503`: S3 service not configured - `code: "S3_SERVICE_NOT_CONFIGURED"`

**Example Error Response:**

```json
{
  "detail": "File too large. Maximum size is 10MB",
  "code": "FILE_TOO_LARGE"
}
```

---

## Resume Parsing API

### Parse Resume from URL

```
POST /resume-parse
```

**Description:** Parse and analyze a resume file from a URL using Dify AI service. Returns streaming response for real-time processing feedback.

**Body:**

```json
{
  "file_url": "https://example.com/resume.pdf"
}
```

**Content-Type:** `application/json`

**Returns:**

- **Success**: Streaming response (`text/event-stream`)
- **Error**: JSON response (`application/json`)

**Streaming Response Format:**

```
data: {"event": "agent_message", "answer": "Analyzing resume..."}

data: {"event": "agent_message", "answer": "Found work experience..."}

data: {"event": "message_end", "metadata": {...}}
```

**JSON Error Responses:**

- `503`: Resume parsing service not configured - `code: "DIFY_CLIENT_NOT_CONFIGURED"`
- `502`: External Dify API service error - `code: "DIFY_HTTP_ERROR" | "DIFY_CONNECTION_ERROR"`
- `422`: Resume parsing failed - `code: "UNSUPPORTED_FILE_TYPE" | "RESUME_PARSE_ERROR"`
- `500`: Internal server error - `code: "INTERNAL_SERVER_ERROR"`

**Example Usage:**

```bash
# Success case - returns streaming data
curl -X POST "http://localhost:8000/resume-parse" \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/resume.pdf"}'

# Error case - returns JSON error
curl -X POST "http://localhost:8000/resume-parse" \
  -H "Content-Type: application/json" \
  -d '{"file_url": "invalid-url"}'
# Returns: {"detail": "Failed to parse resume: ...", "code": "RESUME_PARSE_ERROR"}
```

**Integration Notes:**

- Uses Dify AI service for intelligent resume parsing
- **Supported document types**: TXT, MD, MDX, MARKDOWN, PDF, HTML, XLSX, XLS, DOC, DOCX, CSV, EML, MSG, PPTX, PPT, XML, EPUB
- **Supported image types**: JPG, JPEG, PNG, GIF, WEBP, SVG
- Automatically detects file type from URL extension
- Unsupported file types will return a 422 error before processing
- Streaming response provides real-time feedback during processing
- Errors before streaming starts return JSON format
- Errors during streaming end the stream gracefully

---

## Usage Examples

### Complete Workflow Example

1. **Upload Resume to S3:**

```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@resume.pdf"
```

Response:

```json
{
  "success": true,
  "file_url": "https://bucket.s3.region.amazonaws.com/uploads/dEasNuU22krG.pdf",
  "s3_key": "uploads/dEasNuU22krG.pdf",
  "bucket": "my-bucket",
  "original_name": "resume.pdf",
  "uploaded_name": "dEasNuU22krG.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "folder": "uploads"
}
```

2. **Parse Uploaded Resume:**

```bash
curl -X POST "http://localhost:8000/resume-parse" \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://bucket.s3.region.amazonaws.com/uploads/dEasNuU22krG.pdf"}'
```

This will return a streaming response with real-time parsing results from the Dify AI service.

### Error Handling

The API provides clear error responses with both human-readable messages (`detail`) and machine-readable error codes (`code`):

**Configuration Errors** (return JSON):

```json
{
  "detail": "Resume parsing service is not configured.",
  "code": "DIFY_CLIENT_NOT_CONFIGURED"
}
```

**File Errors** (return JSON):

```json
{
  "detail": "File too large. Maximum size is 10MB",
  "code": "FILE_TOO_LARGE"
}
```

**Processing Errors** (return JSON if before streaming, graceful end if during streaming):

```json
{
  "detail": "External service error: Failed to connect to Dify API",
  "code": "DIFY_CONNECTION_ERROR"
}
```

**File Type Errors** (return JSON):

```json
{
  "detail": "Unsupported file type: .xyz",
  "code": "UNSUPPORTED_FILE_TYPE"
}
```

---

## Technical Implementation

### File Name Generation

- Uses **nanoid** library to generate 12-character unique identifiers
- Format: `{nanoid}.{extension}` (e.g., `dEasNuU22krG.pdf`)
- URL-safe characters only
- No collision risk with proper entropy

### Error Handling Architecture

1. **Pre-streaming validation**: Configuration and basic validation errors return JSON
2. **Streaming errors**: Log errors and end stream gracefully
3. **Proper HTTP status codes**: 503 for configuration, 422 for validation, 500 for server errors

### Streaming Response Details

- Uses Server-Sent Events (SSE) format
- Content-Type: `text/event-stream`
- Real-time feedback during AI processing
- Graceful degradation on errors

---

## API Reference Summary

| Endpoint        | Method | Purpose              | Response Type  |
| --------------- | ------ | -------------------- | -------------- |
| `/upload`       | POST   | Upload file to S3    | JSON           |
| `/resume-parse` | POST   | Parse resume with AI | Streaming/JSON |
