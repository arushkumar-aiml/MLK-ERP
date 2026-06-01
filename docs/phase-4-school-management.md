# Phase 4 School Management

Phase 4 adds the parent School Management layer for future Students, Teachers, Fees, Attendance, Results, and Notices modules. Schools are protected by JWT authentication, role permissions, service-layer business rules, validators, and audit logging.

## Seed Schools

The auth seed now upserts these schools:

- Adarsh Vidya Mandir Pre School, code `AVMP`
- Adarsh Vidya Mandir, code `AVM`
- Ram Manohar Lohia Sarvottam Vidyalaya, code `RMLSV`
- MSA World, code `MSA`

## Files

- `backend/src/models/school.model.js` stores school details, status, settings, logo metadata, assigned principal, and assigned admins.
- `backend/src/validators/school.validator.js` validates create, update, status, principal assignment, and admin assignment requests.
- `backend/src/routes/school.routes.js` registers protected `/api/schools` endpoints.
- `backend/src/controllers/school.controller.js` keeps request/response handling thin and writes audit events.
- `backend/src/services/school.service.js` contains school search, filters, duplicate prevention, assignments, scoped reads, analytics, and delete rules.

## Permissions

- Super Admin: full school access.
- Admin: read-only access to assigned school.
- Principal: read-only access to assigned school.
- Teacher: no school management access.
- Student/Parent equivalent accounts: no school management access.

Permissions:

- `schools:read`: list, detail, analytics.
- `schools:write`: create, update, delete, status changes, principal assignment, admin assignment.

## APIs

Base URL: `http://localhost:5000/api/schools`

All APIs require:

```text
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### POST /api/schools

Creates a school. Super Admin only.

```json
{
  "name": "Adarsh Vidya Mandir Pre School",
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
  },
  "logo": {
    "url": "https://cdn.example.com/schools/avmp/logo.png",
    "storageKey": "schools/avmp/logo.png",
    "mimeType": "image/png",
    "size": 45210
  }
}
```

Success:

```json
{
  "statusCode": 201,
  "data": {
    "school": {
      "name": "Adarsh Vidya Mandir Pre School",
      "code": "AVMP",
      "status": "active"
    }
  },
  "message": "School created",
  "success": true
}
```

### GET /api/schools

Lists schools. Super Admin sees all schools. Admin and Principal see only their assigned school.

Query filters:

- `page`: default `1`
- `limit`: default `20`, max `100`
- `search`: searches name, code, and email
- `status`: `active`, `inactive`, or `suspended`

Example:

```text
GET /api/schools?search=adarsh&status=active&page=1&limit=10
```

### GET /api/schools/:id

Returns school details with assigned principal and admins. Admin and Principal can only fetch their assigned school.

### PUT /api/schools/:id

Updates editable school fields. Super Admin only. The school `code` is immutable after creation.

### DELETE /api/schools/:id

Deletes a school. Super Admin only. Deletion is blocked while users are linked to the school.

### PATCH /api/schools/:id/status

Activates, deactivates, or suspends a school. Super Admin only.

```json
{
  "status": "inactive"
}
```

### POST /api/schools/:id/assign-principal

Assigns an active principal user to a school. Super Admin only.

```json
{
  "principalId": "66f000000000000000000001"
}
```

### POST /api/schools/:id/assign-admin

Assigns an active admin user to a school. Super Admin only.

```json
{
  "adminId": "66f000000000000000000002"
}
```

### GET /api/schools/:id/analytics

Returns linked user, student, teacher, and audit counts for a school. Super Admin can fetch all schools. Admin and Principal can fetch only their assigned school.

Success:

```json
{
  "statusCode": 200,
  "data": {
    "analytics": {
      "school": {
        "id": "66f000000000000000000000",
        "name": "Adarsh Vidya Mandir Pre School",
        "code": "AVMP",
        "status": "active",
        "academicYear": "2026-2027"
      },
      "counts": {
        "users": {
          "admin": 1,
          "principal": 1,
          "teacher": 1
        },
        "userStatuses": {
          "active": 3
        },
        "students": {},
        "teachers": {},
        "auditLogs": 5
      }
    }
  },
  "message": "School analytics fetched",
  "success": true
}
```

## Validation Errors

Missing school name:

```json
{
  "success": false,
  "message": "name is required",
  "status": 400,
  "errors": []
}
```

Duplicate school code:

```json
{
  "success": false,
  "message": "School code already exists",
  "status": 409,
  "errors": []
}
```

Invalid email:

```json
{
  "success": false,
  "message": "email is invalid",
  "status": 400,
  "errors": []
}
```

Permission error:

```json
{
  "success": false,
  "message": "Missing permission: schools:write",
  "status": 403,
  "errors": []
}
```

## Audit Logging

Audit logs are written for:

- `schools.create`
- `schools.update`
- `schools.delete`
- `schools.status.update`
- `schools.principal.assign`
- `schools.admin.assign`

Each event stores actor user ID, school ID, timestamp, IP address, user agent, status, and metadata.

## Postman Examples

Create a collection with variable `baseUrl=http://localhost:5000/api` and `accessToken=<token>`.

```json
{
  "info": {
    "name": "MLK ERP School Management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List Schools",
      "request": {
        "method": "GET",
        "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }],
        "url": "{{baseUrl}}/schools?search=adarsh&status=active"
      }
    },
    {
      "name": "Create School",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{accessToken}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "url": "{{baseUrl}}/schools",
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"MSA World\",\"code\":\"MSA\",\"email\":\"office@msa.example.com\",\"phone\":\"+91 98765 43007\",\"academicYear\":\"2026-2027\"}"
        }
      }
    },
    {
      "name": "Deactivate School",
      "request": {
        "method": "PATCH",
        "header": [
          { "key": "Authorization", "value": "Bearer {{accessToken}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "url": "{{baseUrl}}/schools/{{schoolId}}/status",
        "body": {
          "mode": "raw",
          "raw": "{\"status\":\"inactive\"}"
        }
      }
    }
  ]
}
```
