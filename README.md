# 🔮 AetherFi — Your Arc Wallet Kundli

Connect your wallet and instantly reveal your **on-chain identity** on the [Arc](https://arc.io) Testnet — activity score, rank, badges, an activity chart, and an **AI-powered wallet personality**.

**100% free. No signup. Read-only & safe.**

![Arc Testnet](https://img.shields.io/badge/Arc-Testnet-7c5cff) ![Free](https://img.shields.io/badge/Free-forever-22d3ee)

## ✨ Features

- **Auto wallet connect** — MetaMask, Rabby, Coinbase, OKX & any EIP-6963 wallet
- **Auto add / switch to Arc Testnet** — one approval, no manual RPC entry
- **Activity Score (0–1000)** + rank & percentile
- **Achievement badges** — Early Adopter, Gas Guzzler, USDC Whale & more
- **14-day activity chart**
- **🔮 AI Wallet Personality** — a witty on-chain roast (GPT-powered, with a free built-in fallback)
- **Shareable card** → one-click "Share on X" viral loop

## 🛠 Stack

Next.js 16 · wagmi + viem · RainbowKit · Framer Motion · Tailwind CSS · Blockscout (ArcScan) API

## 🔗 Arc Testnet

| | |
|---|---|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Gas token | USDC |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |

## 🚀 Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

### AI personality (optional)

The AI roast works out of the box with a free local generator. To use real GPT output, add an OpenAI key:

```bash
cp .env.example .env.local
# then set OPENAI_API_KEY=sk-...
```

## 📦 Deploy

Deploys to Vercel out of the box. Add `OPENAI_API_KEY` in Vercel → Project → Settings → Environment Variables to enable AI mode in production.

---

Built for the Arc community · Data via ArcScan · Not affiliated with Circle/Arc.
# Trigger redeploy to pick up new env vars
