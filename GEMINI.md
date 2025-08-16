# PYUSD QR Payments — Project Overview

A small, polished demo to accept **PayPal USD (PYUSD)** via a QR-based flow. A merchant creates a QR “invoice”, a customer scans it with a wallet and pays on **Ethereum Sepolia (testnet)**, and the merchant sees a receipt on a dashboard. Scope is optimized for a **solo, 1-day build** and a clean 2–3 minute demo.

---

## Goals

- **Simple merchant UX:** generate PYUSD invoices as QR codes in seconds.
- **Frictionless payer UX:** scan → wallet pops → approve → done.
- **Clear receipts:** dashboard shows paid invoices via on-chain events.
- **Hackathon-ready:** shipped, open-source, minimal dependencies.

---

## Feature Set

### MVP (ship this first)

- **QR Invoice Generation**

  - Inputs: merchant address, amount (e.g., “5.00”), optional note.
  - Outputs:
    - **EIP-681 ERC-20 transfer URI** for wallet interoperability.
    - **Invoice JSON** for the app’s scanner (invoiceId, amountWei, etc.).
    - Rendered **QR code** encoding the URI and/or JSON wrapper.

- **Scan & Pay**

  - Scan with webcam or paste invoice JSON/URI.
  - Prompt to **switch to Sepolia** if needed.
  - **Router path (recommended):**
    1. `approve(PYUSD, router, amountWei)`
    2. `router.pay(token, merchant, amountWei, invoiceId)`
  - Success view with **tx hash** + explorer link.

- **Merchant Dashboard**
  - Live/periodic read of `PaymentReceived` events from `PaymentRouter`.
  - Table columns: time, invoiceId, payer, amount, token, tx link.
  - Filter by merchant address and invoiceId.

### “Originality” Enhancers (pick 1–2 if time allows)

- **One-time, expiring invoices (anti-replay)**

  - Add `expiresAt`; Router rejects expired or reused `invoiceId`.

### Out of scope (v1)

- Off-ramp to fiat.
- Subgraphs/DBs (read from chain directly).
- Multi-chain settlement (future stretch with CCIP).

---

## App Pages & UX

### `/merchant` — QR Invoice Generator

**Purpose:** Let a merchant quickly create a payable PYUSD invoice.

**UI:**

- Inputs: `merchantAddress` (default: connected wallet), `amount` (“5.00”), `note?`.
- “Generate” → produces **Invoice JSON**, **EIP-681 URI**, and **QR**.
- Preview card: merchant, amount, note, invoiceId.
- Buttons: **Copy JSON**, **Copy URI**.

**Acceptance:**

- Validates address + positive amount.
- Correct 6-decimals conversion for `amountWei`.
- Unique `invoiceId` per invoice.

---

### `/pay` — Scan & Pay

**Purpose:** Payer scans invoice, confirms transfer, gets success state.

**UI:**

- QR **scanner** and a **paste box** for JSON/URI.
- Parsed invoice preview (merchant, amount, note).
- “Connect Wallet” / “Switch to Sepolia” prompts.
- **Router flow:** `approve` → `pay(...)`.
- Success panel with **tx hash** + explorer link.

**Acceptance:**

- Uses correct chain + token.
- Handles cancel/reject cleanly.
- Clear errors on allowance/balance issues.

---

### `/dashboard` — Merchant Receipts

**Purpose:** Show paid invoices via on-chain events.

**UI:**

- Connect merchant wallet.
- Table of `PaymentReceived` (filtered by merchant).
- Columns: timestamp, invoiceId, payer, amount, token, tx link.
- Search by invoiceId; optional date filter.
- Live updates or periodic refresh.

**Acceptance:**

- New rows appear within seconds of payment.
- Proper filtering by connected merchant address.
- Solid empty/loading/error states.

---

## Data Model

### Invoice JSON (QR-encoded for the app)

    {
      "version": "pyusd-invoice-1",
      "chainId": 11155111,
      "token": "0xPYUSD...",         // PYUSD testnet address
      "merchant": "0xMERCHANT...",
      "amount": "5.00",              // decimal string
      "amountWei": "5000000",        // integer string (6 decimals)
      "invoiceId": "uuid-or-hex",    // unique per invoice
      "note": "Coffee",
      "expiresAt": 0                 // optional unix seconds
    }

### EIP-681 ERC-20 Transfer URI (wallet-friendly)

    ethereum:<PYUSD_ADDRESS>/transfer?address=<MERCHANT>&uint256=<AMOUNT_WEI>&chain_id=11155111

> The QR may include both the **URI** (for wallets) and **JSON** (for our app).

---

## Smart Contracts (Hardhat)

### `PaymentRouter.sol` (MVP)

- **Solidity:** ^0.8.24, OpenZeppelin `IERC20`.

**Function**

    function pay(address token, address merchant, uint256 amount, bytes32 invoiceId) external;

- Requires `merchant != 0`, `amount > 0`.
- Calls `IERC20(token).transferFrom(msg.sender, merchant, amount)`; reverts on failure.
- Emits `PaymentReceived(...)`.

**Event**

    event PaymentReceived(
      bytes32 indexed invoiceId,
      address indexed merchant,
      address indexed payer,
      address token,
      uint256 amount,
      uint256 timestamp
    );

**Optional Add-ons**

- **Anti-replay & expiry:**
  - `mapping(bytes32 => bool) usedInvoice;` guard + `expiresAt` param or EIP-712 signed invoice.
- **Hold/refund (escrow):**
  - Store funds; `merchantSettle(invoiceId)` / `buyerRefund(invoiceId)` with simple rules + events.

**Mock token (local fallback only)**

- `MockPYUSD.sol`: ERC-20, **6 decimals**, `mint()` for demo balances.
- **Use official PYUSD on testnet** for submissions; mock is for local dev only.

---

## Tech Stack

**Frontend**

- **React** (React, TypeScript), **Tailwind CSS**
- **wagmi** + **viem** (wallet + on-chain IO)
- **qrcode.react** (generate) & `@yudiel/react-qr-scanner` (scan)

**Smart Contracts**

- **Hardhat** + TypeScript
- **Solidity** ^0.8.24
- **OpenZeppelin** contracts
- Network: **Ethereum Sepolia** (PYUSD + Router)
- Env via `dotenv`

**Tooling**

- Node 18+, npm
- Explorer links (Sepolia)
- Optional FE deploy: Vercel/Netlify

---

## Flows (Happy Paths)

**Merchant**

1. Open `/merchant`, connect wallet (optional).
2. Enter amount and (optionally) override merchant address.
3. Click **Generate** → QR + copyable JSON/URI.

**Payer**

1. Open `/pay`, connect wallet.
2. Scan QR (or paste invoice).
3. Switch to Sepolia if prompted.
4. Approve PYUSD to Router → call `pay(...)`.
5. See **Success** with tx hash.

**Dashboard**

1. Open `/dashboard`, connect merchant wallet.
2. Table shows `PaymentReceived` rows for the connected merchant.

---

## Acceptance Criteria (MVP)

- `/merchant` generates a valid QR (wallets can interpret OR `/pay` can parse).
- Payment completes on Sepolia using **testnet PYUSD** via Router.
- `/dashboard` shows a new row within ~5–15 seconds.
- README includes quickstart, contract addresses, and demo steps.

---

## Demo Script (2–3 minutes)

1. **Create invoice (`/merchant`):** enter $5 → generate QR → show invoice preview.
2. **Pay (`/pay`):** scan QR → approve + pay → show tx hash.
3. **Verify (`/dashboard`):** new receipt appears with invoiceId + payer.
4. (If implemented) Briefly mention expiry/hold as a “buyer protection” twist.

---

## Notes

- Prefer **official PYUSD on testnet** for judging; keep `MockPYUSD` for local dev.
- Keep code and UI small and clean; UX polish matters.
- Document the **invoice schema** to make the project composable/reusable.
