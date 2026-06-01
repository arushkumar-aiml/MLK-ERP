# Phase 4 School Management

Phase 4 adds protected School CRUD APIs using the existing MVC architecture.

## Files

- `backend/src/routes/school.routes.js` registers `/api/schools` endpoints and protects them with JWT auth and school permissions.
- `backend/src/controllers/school.controller.js` handles request/response shaping and audit logging for create, update, and delete actions.
- `backend/src/services/school.service.js` contains school query, pagination, validation, create, update, and delete business logic.

## Permissions

School management uses existing auth permissions:

- `schools:read` for list and detail APIs.
- `schools:write` for create, update, and delete APIs.

The seeded Super Admin has both permissions.

## APIs

Base URL: `http://localhost:5000/api/schools`

All APIs require:

```text
Authorization: Bearer <accessToken>
```

### GET /

Query parameters:

- `page`: page number, default `1`
- `limit`: page size, default `20`, max `100`
- `search`: searches name, code, and email
- `status`: `active`, `inactive`, or `suspended`

### POST /

Request:

```json
{
  "name": "AVM Public School",
  "code": "AVMP",
  "email": "office@avmp.example.com",
  "phone": "+91 98765 43001",
  "academicYear": "2026-2027",
  "status": "active",
  "address": {
    "line1": "Main Road",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "postalCode": "110001"
  },
  "settings": {
    "timezone": "Asia/Kolkata",
    "currency": "INR"
  }
}
```

### GET /:id

Fetches one school by MongoDB ObjectId.

### PUT /:id

Updates editable school fields. The school `code` is intentionally immutable after creation.

### DELETE /:id

Deletes a school only when no users are linked to it.
