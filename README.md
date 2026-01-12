# P402 Base Mini App

A full P402 AI client running as a Base Mini App. Users can connect their Base Account, fund with USDC via Base Pay, and access 100+ AI models through P402's smart routing.

## 🎯 What This Does

```
┌─────────────────────────────────────────┐
│           P402 MINI APP                 │
├─────────────────────────────────────────┤
│                                         │
│  1. CONNECT                             │
│     User connects Base Account          │
│     → Creates P402 session              │
│                                         │
│  2. FUND                                │
│     Add USDC via Base Pay               │
│     → Credits P402 session              │
│                                         │
│  3. CHAT                                │
│     Select model (GPT-4, Claude, etc)   │
│     → Streaming responses               │
│     → Real-time cost display            │
│     → Savings calculation               │
│                                         │
│  4. TRACK                               │
│     See total spent                     │
│     See total saved                     │
│     Per-message cost breakdown          │
│                                         │
└─────────────────────────────────────────┘
```

## 🏗️ Architecture

```
Base Mini App ←→ Mini App API ←→ P402.io API ←→ AI Providers
                     │
                     ├── /api/session   → P402 session management
                     ├── /api/fund      → Base Pay → P402 credits
                     ├── /api/chat      → Streaming AI completions
                     ├── /api/providers → Model listing
                     └── /api/balance   → Real-time balance
```

## 📁 File Structure

```
p402-miniapp/
├── app/
│   ├── .well-known/
│   │   └── farcaster.json/
│   │       └── route.ts          # Manifest endpoint
│   ├── api/
│   │   ├── session/route.ts      # Session management
│   │   ├── fund/route.ts         # Base Pay integration
│   │   ├── chat/route.ts         # AI completions (streaming)
│   │   ├── providers/route.ts    # Model listing
│   │   ├── balance/route.ts      # Balance check
│   │   └── webhook/route.ts      # Mini app events
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Chat.tsx                  # Chat UI + input
│   ├── ConnectScreen.tsx         # Onboarding
│   ├── FundModal.tsx             # Base Pay modal
│   ├── Header.tsx                # Balance display
│   └── ModelSelector.tsx         # Model picker
├── lib/
│   ├── p402-client.ts            # P402 API client
│   ├── store.ts                  # Zustand state
│   └── types.ts                  # TypeScript types
├── public/
│   ├── icon.png                  # 200x200 app icon
│   ├── splash.png                # 1200x1200 splash
│   ├── og-image.png              # 1200x630 social
│   └── screenshots/              # App store images
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd p402-miniapp
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_URL=https://mini.p402.io
P402_API_URL=https://p402.io
```

### 3. Run Locally

```bash
npm run dev
# Open http://localhost:3001
```

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### 5. Create Assets

Required images in `/public`:

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 200x200 | App icon |
| `splash.png` | 1200x1200 | Loading screen |
| `og-image.png` | 1200x630 | Social sharing |
| `screenshots/chat.png` | 1170x2532 | Store screenshot |
| `screenshots/models.png` | 1170x2532 | Store screenshot |
| `screenshots/savings.png` | 1170x2532 | Store screenshot |

### 6. Sign Manifest

1. Go to https://base.dev/preview?tab=account
2. Enter your deployed URL
3. Click "Verify" and sign with Base Account
4. Copy credentials to `.env.local`:

```
MANIFEST_HEADER=eyJ...
MANIFEST_PAYLOAD=eyJ...
MANIFEST_SIGNATURE=MHg...
```

5. Redeploy:
```bash
vercel --prod
```

### 7. Test Your App

1. Go to https://base.dev/preview
2. Enter your app URL
3. Click "Launch" to test

### 8. Publish

Create a post in the Base app with your app URL. It will be indexed automatically.

## 🔌 P402.io Integration Points

### Session Management

```typescript
// Create or get session for wallet
POST /api/v2/sessions
{
  "wallet_address": "0x...",
  "source": "base_miniapp"
}

// Get session
GET /api/v2/sessions/{session_id}
```

### Funding

After Base Pay completes:
```typescript
POST /api/v2/sessions/fund
{
  "session_id": "sess_xxx",
  "amount": "5.00",
  "tx_hash": "0x...",
  "source": "base_pay"
}
```

### Chat Completions

```typescript
POST /api/v2/chat/completions
Headers:
  x-p402-session: sess_xxx
Body:
{
  "model": "groq/llama-3.3-70b-versatile",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

Response includes cost breakdown:
```json
{
  "cost": {
    "input_tokens": 10,
    "output_tokens": 50,
    "total_cost": 0.0001,
    "direct_cost": 0.0008,
    "savings": 0.0007,
    "savings_percent": 87
  }
}
```

## 💳 Base Pay Integration

The mini app uses `@base-org/account` for USDC payments:

```typescript
import { pay, getPaymentStatus } from '@base-org/account';

// Trigger payment
const payment = await pay({
  amount: '5.00',
  to: P402_TREASURY,  // 0xb23f...
});

// Wait for confirmation
const { status } = await getPaymentStatus({ id: payment.id });

if (status === 'completed') {
  // Credit P402 session
  await fundSession(amount, payment.transactionHash);
}
```

## 📊 Analytics Events

The webhook receives:
- `frame_added` - User installed app
- `frame_removed` - User uninstalled
- `notifications_enabled` - User enabled notifications
- `notifications_disabled` - User disabled notifications

## 🎨 Design

Uses P402 neo-brutalist design system:
- Black background (#000)
- Lime primary (#B6FF2E)
- No rounded corners
- 2px borders
- Bold uppercase labels

## 📈 Conversion Flow

```
Base App User
    ↓
Discovers P402 in app directory
    ↓
Opens mini app → Connect screen
    ↓
Connects Base Account → P402 session created
    ↓
Adds $5 USDC via Base Pay
    ↓
Starts chatting → sees real-time savings
    ↓
"I saved 70%!" → shares to followers
    ↓
Continues using OR upgrades to p402.io
```

## 🔗 Links

- P402 Main: https://p402.io
- P402 Docs: https://p402.io/docs
- Base Mini Apps: https://docs.base.org/mini-apps
- Base Pay: https://base.org/pay

## 📝 License

MIT - Part of P402.io
