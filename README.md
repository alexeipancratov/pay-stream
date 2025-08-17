# PayStream

**PayStream** is a demo dApp for the ETH NY 2025 Hackathon, enabling seamless PayPal USD (PYUSD) payments via QR codes on Ethereum Sepolia testnet. Merchants generate QR invoices, payers scan and pay, and receipts are tracked on-chain in a dashboard. The project is open-source, optimized for rapid deployment, and showcases a frictionless crypto payment experience.

## Product Features

### 1. QR Invoice Generation

- Merchants create invoices with address, amount, and optional note.
- Generates EIP-681 ERC-20 transfer URI and Invoice JSON.
- Renders QR code for wallet and app interoperability.

### 2. Scan & Pay

- Payers scan QR or paste invoice data.
- Prompts wallet connection and Sepolia network switch.
- Executes ERC-20 approve and pay flow via PaymentRouter contract.
- Displays transaction hash and explorer link on success.

### 3. Merchant Dashboard

- Live/periodic read of on-chain `PaymentReceived` events.
- Table view: time, invoiceId, payer, amount, token, tx link.
- Filter by merchant address and invoiceId.

### 4. Security & Originality

- One-time, expiring invoices (anti-replay protection).
- Optional invoice expiry and unique invoice IDs.

## Technical Details

- **Frontend:** React (TypeScript), Tailwind CSS, wagmi + viem, qrcode.react, @yudiel/react-qr-scanner.
- **Smart Contracts:** Hardhat, Solidity ^0.8.24, OpenZeppelin, PaymentRouter.sol.
- **Network:** Ethereum Sepolia (testnet PYUSD).
- **Invoice Schema:**
  ```json
  {
    "version": "pyusd-invoice-1",
    "chainId": 11155111,
    "token": "0xPYUSD...",
    "merchant": "0xMERCHANT...",
    "amount": "5.00",
    "amountWei": "5000000",
    "invoiceId": "uuid-or-hex",
    "note": "Coffee",
    "expiresAt": 0
  }
  ```
- **PaymentRouter.sol:**
  - `pay(address token, address merchant, uint256 amount, bytes32 invoiceId)`
  - Emits `PaymentReceived` event for dashboard tracking.

## Quickstart

1. Install dependencies in `contracts/` and `frontend/` folders.
2. Deploy PaymentRouter contract to Sepolia.
3. Start frontend and connect wallet.
4. Generate invoice, pay, and view receipts in dashboard.

## Demo Steps

1. Create invoice (`/merchant`): enter amount, generate QR.
2. Pay (`/pay`): scan QR, approve and pay, view tx hash.
3. Verify (`/dashboard`): see new receipt appear.

---

**PayStream** is built for ETH NY 2025 Hackathon. Fast, composable, and ready for demo!
