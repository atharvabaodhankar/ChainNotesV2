# erc4337-kit

> ERC-4337 Account Abstraction for React — gasless transactions, social login, and smart accounts without the complexity.

Built on **Privy** (auth) · **Pimlico** (bundler + paymaster) · **Permissionless** (smart accounts) · **Polygon Amoy** (default chain)

[![npm](https://img.shields.io/npm/v/erc4337-kit)](https://www.npmjs.com/package/erc4337-kit)
[![license](https://img.shields.io/npm/l/erc4337-kit)](LICENSE)

---

## What this package does

Normally, setting up ERC-4337 means wiring together Privy, Permissionless, Pimlico, viem, wagmi, and writing ~200 lines of boilerplate hooks yourself — dealing with race conditions, polyfills, gas estimation, UserOperation formatting, and paymaster sponsorship.

This package collapses all of that into **three exports**: a provider, a hook, and a transaction hook.

```
Without erc4337-kit:         With erc4337-kit:
─────────────────────        ─────────────────────
200 lines of setup      →    <ChainProvider> (5 lines)
Privy + wagmi + QueryClient  useSmartAccount() (1 line)
Smart account init race fix  useStoreOnChain() (1 line)
Pimlico gas estimation
UserOperation formatting
Error parsing
```

---

## Requirements

- React 18 or 19
- Vite (Next.js support coming)
- Node.js 18+
- A Privy App ID (free at [dashboard.privy.io](https://dashboard.privy.io))
- A Pimlico API Key (free at [dashboard.pimlico.io](https://dashboard.pimlico.io))
- An Alchemy RPC URL (free at [dashboard.alchemy.com](https://dashboard.alchemy.com))

---

## Installation

```bash
# Step 1: install the package
npm install erc4337-kit

# Step 2: install peer dependencies
npm install @privy-io/react-auth @privy-io/wagmi viem wagmi @tanstack/react-query

# Step 3: install browser polyfills (viem needs these)
npm install buffer process
```

---

## Setup (two files to edit, then you're done)

### 1. `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',        // required for viem
    'process.env': {},           // prevents "process is not defined" in some libs
  },
  resolve: {
    alias: {
      '@noble/curves/nist.js': '@noble/curves/nist',  // required for permissionless
    },
  },
})
```

> If you're using Tailwind v4, add `tailwindcss from '@tailwindcss/vite'` to plugins as normal — it's compatible.

### 2. Polyfills — add to the very top of `src/main.jsx`

```jsx
// src/main.jsx — polyfills MUST be the first two lines, before any other imports
import { Buffer } from 'buffer'
import process from 'process'
globalThis.Buffer = Buffer
globalThis.process = process

// Now your normal imports
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChainProvider, polygonAmoy } from 'erc4337-kit'
import App from './App.jsx'

// ... rest of main.jsx (see Step 1 in Usage below)
```

> **Why?** `viem` and `permissionless` use Node.js globals (`Buffer`, `process`) that don't exist in the browser. These polyfills must execute before any library code loads.
>
> **Why not in index.html?** Module scripts in `<head>` can race against the app bundle. Putting polyfills at the top of `main.jsx` ensures they execute first because Vite processes imports in order.
>
> 💡 **Tip:** If a library still complains about `process.env`, ensure the `define` block in `vite.config.js` is present.
>
> ⚠️ If you see `ReferenceError: Buffer is not defined`, the polyfill lines are missing or not at the very top of `main.jsx`.

---

## `.env`

```env
VITE_PRIVY_APP_ID=          # from dashboard.privy.io → your app → App ID
VITE_PIMLICO_API_KEY=       # from dashboard.pimlico.io → API Keys
VITE_RPC_URL=               # from dashboard.alchemy.com → Polygon Amoy → HTTPS URL
VITE_CONTRACT_ADDRESS=      # your deployed contract address (after you deploy)
```

> Never commit `.env` to git. Add it to `.gitignore`.

---

## Usage

### Step 1 — Wrap your app with `ChainProvider`

Your `src/main.jsx` should look like this (polyfills already at the top from setup step 2):

```jsx
// Polyfills — MUST be first (see setup step 2)
import { Buffer } from 'buffer'
import process from 'process'
globalThis.Buffer = Buffer
globalThis.process = process

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChainProvider, polygonAmoy } from 'erc4337-kit'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChainProvider
      privyAppId={import.meta.env.VITE_PRIVY_APP_ID}
      chain={polygonAmoy}
      rpcUrl={import.meta.env.VITE_RPC_URL}
      loginMethods={['google', 'email']}     // optional, this is the default
      appearance={{ theme: 'dark', accentColor: '#7c3aed' }}  // optional
    >
      <App />
    </ChainProvider>
  </React.StrictMode>,
)
```

### Step 2 — Initialize the smart account

```jsx
import { useSmartAccount, polygonAmoy } from 'erc4337-kit'

function App() {
  const {
    login,                 // Function — opens Privy login modal
    logout,                // Function — clears all state
    authenticated,         // boolean — user is logged in
    user,                  // Privy user object (has .email.address, .google.email)
    smartAccountAddress,   // string — the user's smart account address (0x...)
    smartAccountClient,    // SmartAccountClient — use this to send transactions
    isReady,               // boolean — smart account is initialized, safe to transact
    isLoading,             // boolean — still setting up
    error,                 // string | null — human-readable error message
  } = useSmartAccount({
    pimlicoApiKey: import.meta.env.VITE_PIMLICO_API_KEY,
    rpcUrl:        import.meta.env.VITE_RPC_URL,
    chain:         polygonAmoy,
  })

  if (!authenticated) return <button onClick={login}>Sign in</button>
  if (isLoading)      return <p>Setting up your wallet…</p>
  if (error)          return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <p>Smart account: {smartAccountAddress}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  )
}
```

> `smartAccountAddress` is **deterministic** — the same user always gets the same address across sessions. It is a smart contract address, not the user's EOA (embedded wallet). Store this in your database, not the Privy user ID, if you need to link on-chain records to users.

### Step 3 — Send a gasless transaction

#### Option A: use `useStoreOnChain` (simplest — for hash-based data storage)

```jsx
import { useStoreOnChain, sha256Hash } from 'erc4337-kit'

const MY_ABI = [{
  name: 'storeRecord',
  type: 'function',
  inputs: [{ name: 'dataHash', type: 'bytes32' }],
}]

function SubmitForm({ smartAccountClient }) {
  const {
    submit,      // async (args: any[]) => string | null — returns txHash
    txHash,      // string | null
    recordId,    // string | null — decoded bytes32 from first event log
    isLoading,   // boolean
    isSuccess,   // boolean
    error,       // string | null
    reset,       // Function — resets all state back to null
  } = useStoreOnChain({
    smartAccountClient,
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
    abi: MY_ABI,
    functionName: 'storeRecord',
  })

  const handleSubmit = async (rawData) => {
    const hash = await sha256Hash(JSON.stringify(rawData))  // hash locally
    await submit([hash])                                     // send on-chain
  }

  return (
    <div>
      <button onClick={() => handleSubmit({ text: 'my data' })} disabled={isLoading}>
        {isLoading ? 'Storing…' : 'Submit'}
      </button>
      {isSuccess && <p>Stored! Tx: <a href={`https://amoy.polygonscan.com/tx/${txHash}`}>{txHash?.slice(0,10)}…</a></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

#### Option B: use `smartAccountClient.sendTransaction` directly (for any contract call)

```jsx
import { encodeFunctionData, createPublicClient, http } from 'viem'
import { polygonAmoy } from 'erc4337-kit'

const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(import.meta.env.VITE_RPC_URL),
})

const handleAddTodo = async (task) => {
  const calldata = encodeFunctionData({
    abi: contractABI,
    functionName: 'addTodo',
    args: [task],
  })

  // ✅ Correct — use sendTransaction with encoded calldata
  const hash = await smartAccountClient.sendTransaction({
    to: contractAddress,
    data: calldata,
    value: 0n,             // no ETH/MATIC being sent
  })

  console.log('tx hash:', hash)

  // ✅ Wait for confirmation — ALWAYS do this when the result matters
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  if (receipt.status === 'success') {
    console.log('Confirmed in block:', receipt.blockNumber)
    // Safe to update UI, refetch data, show success
  } else {
    console.error('Transaction reverted')
    // Show error to user — the tx was mined but the contract reverted
  }
}
```

> **Critical:** Do NOT use `smartAccountClient.writeContract()`. The smart account client uses `sendTransaction` with `encodeFunctionData`. Calling `writeContract` throws `account.encodeCalls is not a function`.
>
> **Always call `waitForTransactionReceipt`** when the transaction result affects your UI or app state.
> Without it, you're showing success based on the tx being *submitted*, not *confirmed*.
> The UserOperation could still fail during bundler processing or contract execution.

### Step 4 — Read from the contract

For reading, create a standard `publicClient` from viem. Reading is free (no gas, no smart account needed).

```jsx
import { createPublicClient, http } from 'viem'
import { polygonAmoy } from 'erc4337-kit'

const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(import.meta.env.VITE_RPC_URL),
})

// For user-specific data, pass account: smartAccountAddress
const todos = await publicClient.readContract({
  address: contractAddress,
  abi: contractABI,
  functionName: 'getTodos',
  args: [],
  account: smartAccountAddress,  // required for mapping(address => ...) returns
})
```

> `account: smartAccountAddress` is required when your contract uses `msg.sender` to look up data. Without it, the read returns data for address `0x000...000` instead.

---

## Supported chains

```js
import { polygonAmoy, polygon, sepolia, baseSepolia } from 'erc4337-kit'
```

| Export | Network | Use for |
|--------|---------|---------|
| `polygonAmoy` | Polygon Amoy testnet (chain ID 80002) | Development and testing |
| `polygon` | Polygon mainnet | Production |
| `sepolia` | Ethereum Sepolia testnet | Ethereum testing |
| `baseSepolia` | Base Sepolia testnet | Base chain testing |

Any chain supported by both Pimlico and Privy works — these are just the re-exported convenience constants.

---

## Solidity contract compatibility

Your contract works with this package without modification. There is one rule you must understand:

**`msg.sender` in your contract will be the user's Smart Account address, not their EOA.**

This is correct and expected. Your mappings, ownership checks, and identity logic should use `msg.sender` as normal — it will consistently resolve to the user's smart account address every session.

A minimal compatible contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract YourApp {
    // msg.sender = user's Smart Account (consistent, deterministic)
    mapping(address => bytes32[]) private _records;

    function storeRecord(bytes32 dataHash) external {
        _records[msg.sender].push(dataHash);
    }

    function getRecords() external view returns (bytes32[] memory) {
        return _records[msg.sender];
    }
}
```

A template with more complete patterns is included at `node_modules/erc4337-kit/src/contracts/BaseStorage.sol`.

---

## API reference

### `<ChainProvider>`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `privyAppId` | `string` | Yes | — | Your Privy App ID |
| `chain` | `Chain` (viem) | Yes | — | Target blockchain |
| `rpcUrl` | `string` | Yes | — | Alchemy / Infura RPC URL |
| `loginMethods` | `string[]` | No | `['google', 'email']` | Privy login methods |
| `appearance` | `object` | No | `{ theme: 'light' }` | Privy modal appearance |

### `useSmartAccount(config)`

**Config:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pimlicoApiKey` | `string` | Yes | Pimlico API key |
| `rpcUrl` | `string` | Yes | RPC URL matching your chain |
| `chain` | `Chain` (viem) | Yes | Must match ChainProvider |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `login` | `Function` | Opens Privy login modal |
| `logout` | `Function` | Clears all state and logs out |
| `authenticated` | `boolean` | True when user is logged in |
| `user` | `PrivyUser \| null` | Privy user object |
| `smartAccountAddress` | `string \| null` | The user's smart account address |
| `smartAccountClient` | `SmartAccountClient \| null` | For sending transactions |
| `pimlicoClient` | `PimlicoClient \| null` | For gas price reads |
| `isReady` | `boolean` | True when safe to call `sendTransaction` |
| `isLoading` | `boolean` | True during initialization |
| `error` | `string \| null` | Human-readable error |

### `useStoreOnChain(config)`

**Config:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `smartAccountClient` | `SmartAccountClient` | Yes | From `useSmartAccount()` |
| `contractAddress` | `string` | Yes | Deployed contract address |
| `abi` | `Abi` | Yes | Contract ABI (just the functions you need) |
| `functionName` | `string` | Yes | Function to call |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `submit` | `async (args: any[]) => string \| null` | Sends the transaction, returns txHash |
| `txHash` | `string \| null` | Transaction hash after success |
| `recordId` | `string \| null` | bytes32 decoded from first event log |
| `isLoading` | `boolean` | True while submitting |
| `isSuccess` | `boolean` | True after successful submission |
| `error` | `string \| null` | Human-readable error |
| `reset` | `Function` | Clears all state back to null |

### `sha256Hash(data)` / `sha256HashFile(file)`

```js
const hash = await sha256Hash('any string')     // → '0x7f3a...' (66 chars)
const hash = await sha256HashFile(fileObject)   // → '0xabcd...' (66 chars)
```

Both return a `0x`-prefixed hex string that is `bytes32`-compatible. Hashing happens in the browser using the Web Crypto API — no data leaves the device.

---

## Session handling & re-authentication

Privy sessions expire. When they do, `authenticated` becomes `false`, `smartAccountClient` becomes `null`,
and any pending transaction will fail. Your app must handle this gracefully.

### What happens when a session expires

```
User is active → Privy session expires (default: 7 days, configurable)
→ authenticated flips to false
→ smartAccountClient becomes null
→ smartAccountAddress becomes null
→ Any in-flight sendTransaction call will reject
```

### How to handle it

```jsx
import { useSmartAccount, polygonAmoy } from 'erc4337-kit'

function App() {
  const {
    login, logout, authenticated, smartAccountClient,
    isReady, isLoading, error,
  } = useSmartAccount({
    pimlicoApiKey: import.meta.env.VITE_PIMLICO_API_KEY,
    rpcUrl: import.meta.env.VITE_RPC_URL,
    chain: polygonAmoy,
  })

  // Session expired — user was logged in but isn't anymore
  // This is different from "never logged in" — show a re-auth prompt, not the landing page
  const sessionExpired = !authenticated && !isLoading && localStorage.getItem('was_authenticated')

  // Track auth state for session expiry detection
  useEffect(() => {
    if (authenticated) localStorage.setItem('was_authenticated', 'true')
    if (!authenticated && !isLoading) localStorage.removeItem('was_authenticated')
  }, [authenticated, isLoading])

  if (sessionExpired) {
    return (
      <div>
        <p>Your session has expired. Please sign in again.</p>
        <button onClick={login}>Sign back in</button>
      </div>
    )
  }

  if (!authenticated) return <button onClick={login}>Sign in</button>
  if (isLoading) return <p>Setting up your wallet…</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return <Dashboard smartAccountClient={smartAccountClient} />
}
```

### Protecting transactions against stale sessions

```jsx
async function handleSubmit(smartAccountClient, data) {
  // Always check client is still valid before transacting
  if (!smartAccountClient) {
    throw new Error('Wallet session expired — please sign in again')
  }

  try {
    const hash = await smartAccountClient.sendTransaction({ /* ... */ })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return receipt
  } catch (err) {
    // Privy session errors surface as auth failures
    if (err.message?.includes('not authenticated') || err.message?.includes('session')) {
      // Trigger re-login flow
      throw new Error('Session expired during transaction — please sign in and retry')
    }
    throw err
  }
}
```

### Key rules

```
- Always null-check smartAccountClient before calling sendTransaction
- Detect session expiry vs "never logged in" — different UX for each
- Never cache smartAccountClient in a ref or outside React state — it becomes stale
- Privy session length is configurable in your Privy dashboard (Settings → Session)
- For long-running apps, consider showing a warning 5 minutes before expiry
```

---

## Troubleshooting

### `ReferenceError: Buffer is not defined`
The polyfill imports are missing from the top of `src/main.jsx`, or they're placed after other imports. The `Buffer` and `process` polyfills must be the very first lines in `main.jsx`, before any library imports. See setup step 2.

### Smart account not initializing
Check all three env vars are set and correct. Add `console.log(error)` from `useSmartAccount` to see the exact message. Most commonly: wrong Pimlico API key, or Polygon Amoy not enabled in your Pimlico dashboard.

### `account.encodeCalls is not a function`
You called `smartAccountClient.writeContract()`. Use `smartAccountClient.sendTransaction()` with `encodeFunctionData()` from viem instead. See Option B in usage above.

### Contract reads returning empty or wrong data
You're missing `account: smartAccountAddress` in `publicClient.readContract()`. Without it, reads go out as address `0x0` which returns empty mappings.

### `AA21` — paymaster rejected
Your Pimlico API key is wrong, or Polygon Amoy isn't enabled in your Pimlico project dashboard. The erc4337-kit error message will say this in plain English.

### `AA31` — paymaster out of funds
Your Pimlico paymaster balance is empty. The free tier works for testnet — log in and check your dashboard balance.

### `nonce` error
A previous UserOperation from this smart account is still pending in the bundler mempool. Wait 30–60 seconds and retry.

### Transaction hash returned but transaction never confirms
You're not calling `waitForTransactionReceipt`. The hash from `sendTransaction` means the UserOperation was *submitted* to the bundler, not that it was *included* in a block. Always await the receipt for operations where confirmation matters. See Option B in usage above.

### Session expired during use
Privy sessions have a configurable TTL (default 7 days). When a session expires mid-use, `smartAccountClient` becomes null. Guard all transaction calls with a null check and prompt re-authentication. See the "Session handling" section above.

---

## Production checklist

- [ ] Move from Polygon Amoy to Polygon mainnet (change `chain` and `rpcUrl`)
- [ ] Upgrade Pimlico to a paid plan (free tier is testnet only)
- [ ] Set `PRIVATE_KEY` and deployment keys only in server env, never in `VITE_` prefixed vars
- [ ] Audit your Solidity contract before mainnet
- [ ] Add `waitForTransactionReceipt` after every `sendTransaction` where confirmation matters
- [ ] Check `receipt.status === 'success'` — a mined tx can still be a reverted tx
- [ ] Handle the `error` state from `useSmartAccount` visibly in your UI
- [ ] Null-check `smartAccountClient` before every transaction call
- [ ] Handle Privy session expiry — detect it, prompt re-auth, don't silently fail
- [ ] Configure Privy session TTL in your dashboard (Settings → Session)
- [ ] Polyfills are in `main.jsx` (not `index.html`) — verify they're the first imports
- [ ] Add `.env` to `.gitignore`

---

## Contributing

Found a bug? Have a feature request? Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Links

- **npm**: https://www.npmjs.com/package/erc4337-kit
- **GitHub**: https://github.com/atharvabaodhankar/erc4337-kit
- **Privy dashboard**: https://dashboard.privy.io
- **Pimlico dashboard**: https://dashboard.pimlico.io
- **Alchemy**: https://dashboard.alchemy.com
- **Polygon Amoy explorer**: https://amoy.polygonscan.com
- **ERC-4337 spec**: https://eips.ethereum.org/EIPS/eip-4337

---

## Support

- 🐛 Issues: https://github.com/atharvabaodhankar/erc4337-kit/issues
- 💬 Discussions: https://github.com/atharvabaodhankar/erc4337-kit/discussions

---

## License

MIT 

---

## Changelog

When a pattern changes, add an entry here. Format: `YYYY-MM-DD — what changed and why`.

| Date | Change | Reason |
|------|--------|--------|
| 2026-05-10 | Added `ERC-4337/` folder reference and load map entries to README | ERC-4337-KIT.md and ERC-4337/ folder were undocumented in the agent index |
| 2026-05-10 | Added changelog section | Establishing versioning across all context files |