This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Twin Club Signing – Remote Collaborative Setup

Two users in different locations can sign the same document in real time. Deploy to Vercel and configure Supabase once.

### 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/schema.sql` to create tables and storage.
3. If the Storage bucket `documents` wasn’t created by the script:
   - Go to **Storage** → **New bucket** → name: `documents`, **Public**.
4. In **Project Settings** → **API**, copy the Project URL and anon/public key.

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy to Vercel

1. Push your repo to GitHub and import it in [Vercel](https://vercel.com).
2. In the project’s **Settings** → **Environment Variables**, add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Redeploy if needed.

### Flow

- User A: Start session → share link → upload PDF.
- User B (any IP / PC / country): Open link → sees PDF and can sign.
- Both see each other’s signatures in real time via Supabase Realtime.
