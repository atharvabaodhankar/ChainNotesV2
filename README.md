# ChainNotesV2
### The Secure, Gasless, and Decentralized Web3 Note-Taking Application

ChainNotesV2 is a premium decentralized note-taking application designed to remove traditional Web3 user friction. It integrates social OAuth logins, headless smart accounts, gasless transaction sponsorship, and encrypted/sanitized IPFS note storage on the **Polygon Amoy Testnet** into a glassmorphic dashboard experience.

---

## 🚀 Key Features

*   **OAuth Social Logins & Signer Sync**: Powered by **Privy**, allowing instant logins via Google, Email, or standard Web3 wallets like MetaMask.
*   **Account Abstraction & 1-Click Keyset Generation**: Deterministic smart contracts (**SimpleSmartAccount v0.6** via `permissionless.js`) automatically bind to the user's social identity. Headless embedded wallet keyset generation resolves empty wallet state on the fly.
*   **100% Gasless Transaction Sponsorship**: Every single note upload is completely sponsored by **Pimlico's Paymaster engine**. Users sign transactions gaslessly without holding native tokens.
*   **Vercel Serverless Security Proxy**: Master Pinata IPFS credentials (`PINATA_API_KEY`, `PINATA_API_SECRET`, `PINATA_JWT`) are entirely hidden. Browser requests are proxied securely through Vercel Serverless Node.js endpoints (`/api/pinFile` and `/api/pinJSON`) preventing any client-side key theft.
*   **Limit-Free View Call Queries**: Note retrievals bypass restrictive public RPC block limits (10,000 blocks) and Alchemy free tier restrictions (10 blocks) by using standard static state calls with sender overrides (`readContract` passing `account: smartAccountAddress`).
*   **Premium HSL Glassmorphism UI**: High-fidelity, animated dark-mode workspace utilizing **Tailwind CSS v4** and `@tailwindcss/vite` compiler integration.

---

## 🛠️ The Tech Stack

*   **Frontend**: React (v19) + Vite + Tailwind CSS (v4)
*   **Web3 Signers**: `@privy-io/react-auth`
*   **Smart Accounts (ERC-4337)**: `permissionless` (v0.3) & `viem` (v2.x)
*   **Bundler & Paymaster**: `permissionless/clients/pimlico`
*   **Decentralized Storage**: Pinata IPFS gateway + direct proxy uploading
*   **Smart Contract Layer**: `Notes.sol` Solidity contract deployed on Polygon Amoy at [`0x1Daaa7e5FCaBdEf7e7299109bcF71E676Dd2C297`](https://amoy.polygonscan.com/address/0x1Daaa7e5FCaBdEf7e7299109bcF71E676Dd2C297).

---

## ⚙️ Setup & Configuration

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in your project root and add the following keys:
```env
# Privy Config (from dashboard.privy.io)
VITE_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Pimlico Config (from dashboard.pimlico.io)
VITE_PIMLICO_API_KEY=your_pimlico_key

# Blockchain Node (from dashboard.alchemy.com)
VITE_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_alchemy_key
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your_alchemy_key

# Private Deployment Deployer (Optional)
PRIVATE_KEY=your_deployer_private_key

# Pinata Gateways (from dashboard.pinata.cloud)
VITE_PINATA_GATEWAY_URL=https://your-domain.mypinata.cloud
VITE_PINATA_GATEWAY_TOKEN=your_private_gateway_token

# Pinata API Keys (Hidden from Frontend - Server-Side Only!)
PINATA_API_KEY=your_master_key
PINATA_API_SECRET=your_master_secret
PINATA_JWT=your_master_jwt_token
```

---

## 💻 Running Locally vs Deploying

### A. Run Development Server
```bash
npm run dev
```
*Note: In local development mode (`import.meta.env.DEV`), file uploads automatically utilize mock fallback CIDs if the local Vercel serverless environment is not running, ensuring instant developer workflows.*

### B. Compile Production Build
```bash
npm run build
```
Generates highly optimized, rolldown-minified chunks in under 3 seconds.

### C. Deploying to Vercel (Production Security)
1. Push your repository to GitHub and link it to **Vercel**.
2. Vercel automatically detects the `/api` directory and hosts both `api/pinFile.js` and `api/pinJSON.js` as secure, isolated Node.js Serverless Functions.
3. Add the server-side credentials (`PINATA_API_KEY`, `PINATA_API_SECRET`, and `PINATA_JWT`) in the Vercel Dashboard's Project Environment variables (without `VITE_` prefix to keep them server-only).
4. Whitelist your Vercel URL under CORS domains in both **Privy** and **Alchemy** dashboard panels.

---

## 🛠️ Developer Tooling: Git Commit Date Rewriter

Included in the repository is a highly customizable history date rewriter: **[`git_rewriter.py`](file:///c:/Users/baodh/OneDrive/Desktop/Projects/ChainNotesV2/git_rewriter.py)**. 

It preserves all authors, commit messages (including complex quote/backtick escaping), and creates safe backups automatically.

### Command Guide:
*   **Dry Run Preview**:
    ```bash
    python git_rewriter.py --start-date 2026-04-26 --end-date 2026-05-01 --dry-run
    ```
*   **Execute Rewrite (CP1252/Windows Console Safe)**:
    ```bash
    python git_rewriter.py --start-date 2026-04-26 --end-date 2026-05-01
    ```
*   **CLI Flags**:
    *   `--start-date` (YYYY-MM-DD) [Required]
    *   `--end-date` (YYYY-MM-DD) [Optional]
    *   `--pattern` (e.g. `3,4,5` commits cyclic distribution) [Optional]
    *   `--start-commit` / `--end-commit` (1-indexed range limits) [Optional]
    *   `--skip-weekends` (Filters Saturdays & Sundays) [Optional]

---

## 📄 License

This project is licensed under the MIT License.
