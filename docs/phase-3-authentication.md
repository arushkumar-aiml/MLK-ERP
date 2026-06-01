# Phase 3 Authentication

Owner: Anuj Gupta

The authentication module follows MVC boundaries:

- Routes define HTTP endpoints.
- Controllers parse requests and shape responses.
- Services own business logic.
- Middleware protects routes and enforces RBAC.
- Models persist users and audit events.
- Utilities keep token, login ID, response, and error logic reusable.

## APIs

Base URL: `http://localhost:5000/api/auth`

### POST /login

Request:

```json
{
  "loginId": "SADM-001",
  "password": "MLK@123456"
}
```

Alternative identifiers:

```json
{
  "username": "admin",
  "password": "MLK@123456"
}
```

Success:

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "loginId": "SADM-001",
      "username": "admin",
      "role": "superadmin",
      "status": "active"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "refreshTokenExpiresAt": "2026-06-08T00:00:00.000Z"
  },
  "message": "Login successful",
  "success": true
}
```

Errors:

```json
{
  "success": false,
  "message": "Invalid credentials",
  "status": 401,
  "errors": []
}
```

```json
{
  "success": false,
  "message": "Account is inactive",
  "status": 403,
  "errors": []
}
```

### POST /logout

Headers:

```text
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Success:

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Logout successful",
  "success": true
}
```

### POST /refresh-token

Request:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Success:

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "rotated-jwt-refresh-token"
  },
  "message": "Token refreshed",
  "success": true
}
```

Error:

```json
{
  "success": false,
  "message": "Refresh token is invalid or expired",
  "status": 401,
  "errors": []
}
```

### GET /profile

Headers:

```text
Authorization: Bearer <accessToken>
```

Success:

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "loginId": "ADM-AVMP-001",
      "role": "admin",
      "status": "active"
    }
  },
  "message": "Profile fetched",
  "success": true
}
```

### PUT /change-password

Headers:

```text
Authorization: Bearer <accessToken>
```

Request:

```json
{
  "currentPassword": "MLK@123456",
  "newPassword": "NewStrong@123"
}
```

Success:

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "loginId": "SADM-001",
      "role": "superadmin"
    }
  },
  "message": "Password changed successfully",
  "success": true
}
```

Error:

```json
{
  "success": false,
  "message": "Current password is incorrect",
  "status": 401,
  "errors": []
}
```

## Seed Data

Run:

```bash
cd backend
npm run seed:auth
```

Generated accounts:

- Super Admin: `SADM-001`, username `admin`
- Admin: `ADM-AVMP-001`
- Principal: `PRI-AVMP-001`
- Teacher: `TCH-AVMP-001`

Default password: `MLK@123456`, or `SEED_DEFAULT_PASSWORD` when set.

## Forgot Password Architecture

The User model includes `passwordResetTokenHash` and `passwordResetExpiresAt`.
The auth service includes `createPasswordResetRequest(identifier)` to generate a raw reset token and store only its SHA-256 hash. Email/SMS delivery and reset-confirm APIs are intentionally left for a later notification phase.
