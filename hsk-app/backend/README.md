# HSK App Backend

## Setup Database (Neon)

1. Tạo project trên Neon.tech
2. Copy connection string
3. Tạo file `.env`:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
```

## Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (first time)
npm run db:push

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Deploy Steps

### 1. Setup Neon Database
- Go to https://neon.tech
- Create new project
- Copy connection string

### 2. Update Environment Variables
- Add `?sslmode=require` to end of DATABASE_URL
- Generate secure NEXTAUTH_SECRET

### 3. Deploy Schema
```bash
npm run db:push
npm run db:seed
```

### 4. Vercel Configuration
- Add DATABASE_URL in Vercel Environment Variables
- Add NEXTAUTH_SECRET in Vercel Environment Variables
