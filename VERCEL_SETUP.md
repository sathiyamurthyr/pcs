Vercel deployment & custom domain setup

1) Add domain to Vercel
- Open your Vercel project dashboard: https://vercel.com/sathiyamurthyrs-projects/pooja-catering-service/ACLhTPPcmzogwNzdZY2LhCHbg2V1
- Go to Settings → Domains → Add and enter `poojacateringservice.in`.

2) DNS records to add at your registrar (preferred minimal setup)
- Apex (@) A record → 76.76.21.21
- `www` CNAME → cname.vercel-dns.com

Alternative: delegate nameservers to Vercel (recommended if you want Vercel to manage DNS). Vercel will provide nameserver values when you choose that option.

3) Verify domain in Vercel
- After adding DNS records, click "Verify" in Vercel and wait for propagation (can take minutes to 24h).

4) Environment variables (Production)
In Vercel, go to Settings → Environment Variables and add these (use your real production values):
- `DB_HOST` = your_production_db_host
- `DB_USER` = your_db_user
- `DB_PASSWORD` = your_db_password
- `DB_NAME` = pooja_db
- `JWT_SECRET` = (secure secret)
- `JWT_EXPIRE` = 7d

Notes:
- The `.env` in the repo contains `DB_HOST=localhost` which won't work on Vercel. You must use a hosted DB (PlanetScale, AWS RDS, ClearDB, etc.) or host the backend elsewhere.
- Vercel is optimized for serverless functions. A persistent Express server may not behave as expected. Options:
  - Keep the Node backend on a VM/Render/Heroku and point frontend to that API.
  - Convert API routes to Vercel Serverless Functions.

5) Optional: use Vercel CLI to set env vars and deploy
Install Vercel CLI and login:

```bash
npm i -g vercel
vercel login
```

Add env vars via CLI (example for production):

```bash
vercel env add DB_HOST production
vercel env add DB_USER production
vercel env add DB_PASSWORD production
vercel env add DB_NAME production
vercel env add JWT_SECRET production
vercel env add JWT_EXPIRE production
```

Deploy to production:

```bash
vercel --prod
```

6) Verify app
- Visit: https://poojacateringservice.in/ (or the Vercel-provided URL) after DNS and deploy succeed.

If you want, I can:
- Generate the exact DNS change instructions for your registrar (please tell me the registrar name), or
- Help provision a managed MySQL (PlanetScale or AWS RDS) and show how to update Vercel environment variables.
