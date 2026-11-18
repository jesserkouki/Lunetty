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

## Google sign-in with Clerk

The existing login modal supports email/password and Google through Clerk.
Clerk owns the browser session; the backend verifies the Clerk session token,
links it to `Utilisateur`, and authorizes protected API requests using the
verified Clerk subject.

Add these values to `Frontend-cross-platform/webfront/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
```

For Docker Compose, the frontend service reads Clerk variables from the
backend's private `backend/.env` file. The frontend does not receive its
database URL. Its Next.js build output is kept in the container rather than a
persistent volume so rebuilt images do not reuse stale output. For standalone
frontend development, provide `CLERK_SECRET_KEY` through the local process
environment.

The publishable key is intended for browser use. Never put `CLERK_SECRET_KEY`
or Google OAuth client secrets in a `NEXT_PUBLIC_*` variable.

In the Clerk Dashboard, enable Google under **SSO connections** and configure
the Google OAuth client ID and secret there. Create a Google OAuth **Web
application** client in Google Cloud, complete its consent-screen configuration,
and copy the exact redirect URI shown by Clerk into Google's authorized
redirect URIs. Add the frontend's local and production origins to Clerk's
allowed origins/redirect URLs. The app returns through `/sso-callback` and
`/auth/complete`; the Google redirect URI itself is the one Clerk displays,
not either app route.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
