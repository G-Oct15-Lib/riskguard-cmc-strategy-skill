# Deployment Guide

## GitHub

Initialize and commit locally:

```bash
git init
git add .
git commit -m "Initial RiskGuard CMC strategy skill"
```

Create a public GitHub repository named:

```text
riskguard-cmc-strategy-skill
```

Then connect the local repo:

```bash
git remote add origin https://github.com/YOUR_USERNAME/riskguard-cmc-strategy-skill.git
git branch -M main
git push -u origin main
```

## Vercel

Recommended settings:

- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: leave default
- Environment variable, optional: `CMC_PRO_API_KEY`

CLI deployment:

```bash
npm i -g vercel
vercel
vercel --prod
```

If no `CMC_PRO_API_KEY` is configured, the app still works with deterministic demo OHLCV data.

## DoraHacks

Use:

- Project name: `RiskGuard CMC Strategy Skill`
- Track: `Track 2: Strategy Skills`
- Prize target: `Best Use of Agent Hub / CoinMarketCap`
- GitHub URL: public repo URL
- Website URL: Vercel production URL
- Video URL: uploaded demo video URL
