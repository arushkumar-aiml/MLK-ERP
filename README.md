# Mother's Love Kids ERP

MLK ERP is the backend and frontend workspace for Mother's Love Kids.

Owner: Anuj Gupta

## Project Structure

- `backend/` - Express API, MongoDB connection, authentication routes, controllers, services, middleware, models, and seed data.
- `frontend/` - React + Vite application shell.
- `docs/` - Phase notes and API examples.

## Backend Installation

```bash
cd backend
npm install
```

## Environment Setup

Create `backend/.env` from `backend/.env.example`.

Required variables:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/mlk-erp
JWT_SECRET=replace-with-a-long-random-production-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-production-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SEED_DEFAULT_PASSWORD=MLK@123456
```

`JWT_SECRET` and `JWT_REFRESH_SECRET` must be different and at least 16 characters.

## Running Backend

Start MongoDB first, then run:

```bash
cd backend
npm run dev
```

Production-style start:

```bash
cd backend
npm start
```

Expected successful output:

```text
MongoDB connected: 127.0.0.1/mlk-erp
MLK ERP API running on port 5000 in development mode
```

If MongoDB is not running, startup fails with an error similar to:

```text
MongoDB initial connection failed: connect ECONNREFUSED 127.0.0.1:27017
Failed to start API server: ...
```

## Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "MLK ERP API Running",
  "environment": "development"
}
```

## Seed Authentication Users

After MongoDB is running:

```bash
cd backend
npm run seed:auth
```

Generated login credentials:

- Super Admin: `SADM-001`, username `admin`, password `MLK@123456`
- Admin: `ADM-AVMP-001`, username `admin.avmp`, password `MLK@123456`
- Principal: `PRI-AVMP-001`, username `principal.avmp`, password `MLK@123456`
- Teacher: `TCH-AVMP-001`, username `teacher.avmp`, password `MLK@123456`

## Testing Authentication APIs

Login:

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"loginId\":\"SADM-001\",\"password\":\"MLK@123456\"}"
```

Profile:

```bash
curl http://localhost:5000/api/auth/profile ^
  -H "Authorization: Bearer <accessToken>"
```

Refresh token:

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"<refreshToken>\"}"
```

Logout:

```bash
curl -X POST http://localhost:5000/api/auth/logout ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"<refreshToken>\"}"
```

More request and response examples are available in `docs/phase-3-authentication.md`.

## School Management APIs

School CRUD is available under:

```text
/api/schools
```

All school routes require an access token. The seeded Super Admin can use these APIs because it has `schools:read` and `schools:write`.

Common endpoints:

```bash
GET /api/schools
POST /api/schools
GET /api/schools/:id
PUT /api/schools/:id
DELETE /api/schools/:id
```

School API details are available in `docs/phase-4-school-management.md`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```
