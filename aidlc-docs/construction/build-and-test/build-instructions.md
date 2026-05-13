# Build Instructions — Unit 3 (Order + SSE)

## Prerequisites
- Node.js 20 LTS
- Docker (for PostgreSQL)
- npm installed

## Steps

### 1. Install Dependencies

```bash
# Root
cd /home/ec2-user/environment/table-order
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start Database

```bash
cd /home/ec2-user/environment/table-order
docker compose up -d db
```

### 3. Run Migration + Seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Backend Dev Server

```bash
cd backend
npm run dev
# Expected: Server listening on http://localhost:3000
# Verify: curl http://localhost:3000/health → {"success":true,"data":{"ok":true,...}}
```

### 5. Start Frontend Dev Server

```bash
cd frontend
npm run dev
# Expected: Vite dev server on http://localhost:5173
```

### 6. TypeScript Compilation Check

```bash
# Backend
cd backend
npx tsc --noEmit

# Frontend
cd ../frontend
npx tsc --noEmit
```

## Expected Results
- Backend compiles without errors
- Frontend compiles without errors
- Health endpoint responds 200
- All 5 order API endpoints registered and respond
- SSE endpoint establishes connection
