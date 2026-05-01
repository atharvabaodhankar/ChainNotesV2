// src/utils/web3.js
import { createPublicClient, http } from 'viem';
import { polygonAmoy, localhost } from 'viem/chains';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient } from 'permissionless';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import contractAddresses from '../config/contractAddresses.json';
import NotesABI from '../config/abis/Notes.json';

// EntryPoint v0.6 Address
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// Contract deployment block on Polygon Amoy (May 29 2026 ~block 39,174,000)
// Using a safe margin slightly before deployment — no notes can exist before this
const CONTRACT_DEPLOYMENT_BLOCK = 39174000n;

const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY || "";

// Always use the public Polygon Amoy RPC for read operations.
// Alchemy free tier allows only 10-block ranges on eth_getLogs — unusable for event scanning.
// The public RPC supports up to ~500,000 block ranges without auth.
const PUBLIC_AMOY_RPC = "https://rpc-amoy.polygon.technology";

// Bundler/paymaster still go through Alchemy or your configured RPC — that's fine.
const BUNDLER_RPC_URL = import.meta.env.VITE_RPC_URL || PUBLIC_AMOY_RPC;

// Determine which network to use
const getActiveChain = () => {
  if (contractAddresses.network === "localhost") {
    return localhost;
  }
  return polygonAmoy;
};

// Public client always uses the public RPC to avoid Alchemy getLogs restrictions
export const getPublicClient = () => {
  const chain = getActiveChain();
  const transportUrl = chain.id === 1337 || chain.id === 31337
    ? "http://127.0.0.1:8545"
    : PUBLIC_AMOY_RPC;

  return createPublicClient({
    chain,
    transport: http(transportUrl),
  });
};

/**
 * Initializes the smart account client using Privy embedded wallet's viem Account
 * @param {object} viemAccount - viem Account from Privy's toViemAccount()
 * @param {string} userAddress - The EOA wallet address
 * @returns {Promise<object>} SmartAccountClient or MockClient
 */
export const initSmartAccount = async (viemAccount, userAddress) => {
  const chain = getActiveChain();

  // MOCK FALLBACK: No Pimlico key or no signer → simulated client
  if (!PIMLICO_API_KEY || !viemAccount) {
    console.warn("[ChainNotes] Pimlico API key or viem account not found. Using simulated smart account client.");
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockSmartAddress = userAddress
      ? `0xAA${userAddress.substring(4)}`
      : "0xSmartAccountMockAddress" + Math.random().toString(36).substring(7);

    return {
      isMock: true,
      address: mockSmartAddress,
      ownerAddress: userAddress,
      chain,
      getNotes: async () => {
        const key = `notes_${mockSmartAddress.toLowerCase()}`;
        return JSON.parse(localStorage.getItem(key) || "[]");
      },
      createNote: async (cid, onStepChange) => {
        onStepChange?.("Uploading note details to decentralized IPFS...");
        await new Promise((res) => setTimeout(res, 1200));
        onStepChange?.("Constructing UserOperation with entryPoint...");
        await new Promise((res) => setTimeout(res, 800));
        onStepChange?.("Requesting Pimlico Bundler signatures...");
        await new Promise((res) => setTimeout(res, 1000));
        onStepChange?.("Sponsoring gas via Pimlico Paymaster (Gasless!)...");
        await new Promise((res) => setTimeout(res, 1100));
        onStepChange?.("Submitting sponsored transaction to Polygon network...");
        await new Promise((res) => setTimeout(res, 1200));

        const key = `notes_${mockSmartAddress.toLowerCase()}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push(cid);
        localStorage.setItem(key, JSON.stringify(existing));

        import('canvas-confetti').then((m) => m.default({ particleCount: 100, spread: 70 }));
        onStepChange?.("Success! Note saved on-chain!");
        return { hash: "0xMockTxHash" + Math.random().toString(36).substring(7), success: true };
      }
    };
  }

  // REAL FLOW
  try {
    // publicClient always uses the public RPC (no getLogs restrictions)
    const publicClient = getPublicClient();

    console.log("[ChainNotes] Creating SimpleSmartAccount with real viem signer from Privy...");

    const simpleAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: viemAccount,
      entryPoint: {
        address: ENTRY_POINT_ADDRESS,
        version: "0.6",
      },
    });

    const pimlicoUrl = `https://api.pimlico.io/v2/80002/rpc?apikey=${PIMLICO_API_KEY}`;

    const pimlicoClient = createPimlicoClient({
      transport: http(pimlicoUrl),
      entryPoint: {
        address: ENTRY_POINT_ADDRESS,
        version: "0.6",
      },
    });

    const smartAccountClient = createSmartAccountClient({
      account: simpleAccount,
      chain,
      bundlerTransport: http(pimlicoUrl),
      paymaster: pimlicoClient,
      userOperation: {
        estimateFeesPerGas: async () => {
          return (await pimlicoClient.getUserOperationGasPrice()).fast;
        },
      },
    });

    return {
      ...smartAccountClient,
      isMock: false,
      address: simpleAccount.address,
      ownerAddress: userAddress,

      getNotes: async () => {
        try {
          console.log("[ChainNotes] Fetching notes from contract view for:", simpleAccount.address);
          return await publicClient.readContract({
            address: contractAddresses.Notes,
            abi: NotesABI.abi,
            functionName: 'getNotes',
            account: simpleAccount.address
          });
        } catch (e) {
          console.error("[ChainNotes] Error reading notes from contract view:", e);
          return [];
        }
      },

      createNote: async (cid, onStepChange) => {
        onStepChange?.("Constructing UserOperation...");

        const hash = await smartAccountClient.writeContract({
          address: contractAddresses.Notes,
          abi: NotesABI.abi,
          functionName: 'createNote',
          args: [cid],
        });

        onStepChange?.("Transaction submitted! Waiting for block confirmation...");

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        onStepChange?.("Success! Gasless note created!");

        import('canvas-confetti').then((m) => m.default({ particleCount: 150, spread: 80 }));

        return { hash, receipt, success: true };
      },
    };
  } catch (error) {
    console.error("Failed to initialize smart account client:", error);
    throw error;
  }
};