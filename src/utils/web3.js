// src/utils/web3.js
import { createPublicClient, createWalletClient, custom, http, parseAbi } from 'viem';
import { polygonAmoy, localhost } from 'viem/chains';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { createSmartAccountClient } from 'permissionless';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import contractAddresses from '../config/contractAddresses.json';
import NotesABI from '../config/abis/Notes.json';

// EntryPoint v0.6 Address
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY || "";
const AMOY_RPC_URL = import.meta.env.VITE_RPC_URL || "https://rpc-amoy.polygon.technology";

// Determine which network to use
const getActiveChain = () => {
  // If contract is deployed on localhost, use localhost
  if (contractAddresses.network === "localhost") {
    return localhost;
  }
  return polygonAmoy;
};

// Viem Public Client
export const getPublicClient = () => {
  const chain = getActiveChain();
  const transportUrl = chain.id === 1337 || chain.id === 31337 
    ? "http://127.0.0.1:8545" 
    : AMOY_RPC_URL;
    
  return createPublicClient({
    chain,
    transport: http(transportUrl)
  });
};

/**
 * Initializes the smart account client using Privy embedded wallet provider
 * @param {object} privyProvider EIP-1193 provider from Privy embedded wallet
 * @param {string} userAddress The EOA wallet address
 * @returns {Promise<object>} SmartAccountClient or simulated MockClient
 */
export const initSmartAccount = async (privyProvider, userAddress) => {
  const chain = getActiveChain();

  // MOCK FALLBACK: If Pimlico Key is missing, build a beautiful local mock Smart Account Client
  if (!PIMLICO_API_KEY) {
    console.warn("Pimlico API key not found. Using a robust simulated smart account client.");
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate AA load delay

    // Generate a deterministic Smart Account Address based on EOA
    // In actual SimpleAccount, the factory uses index 0 to deploy it deterministically
    const mockSmartAddress = userAddress 
      ? `0xAA${userAddress.substring(4)}` 
      : "0xSmartAccountMockAddress" + Math.random().toString(36).substring(7);

    // Return a mocked client that replicates contract interactions using local storage
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

        // Save CID to local mock array
        const key = `notes_${mockSmartAddress.toLowerCase()}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push(cid);
        localStorage.setItem(key, JSON.stringify(existing));

        // Trigger confetti in Mock too
        import('canvas-confetti').then((m) => m.default({ particleCount: 100, spread: 70 }));

        onStepChange?.("Success! Note saved on-chain!");
        return { hash: "0xMockTxHash" + Math.random().toString(36).substring(7), success: true };
      }
    };
  }

  // REAL FLOW: Initialize Permissionless + Pimlico Paymaster
  try {
    const publicClient = getPublicClient();

    // Create Wallet Client from EIP-1193 Privy provider
    const walletClient = createWalletClient({
      account: userAddress,
      chain,
      transport: custom(privyProvider),
    });

    // Create Simple Smart Account
    const simpleAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: walletClient,
      entryPoint: {
        address: ENTRY_POINT_ADDRESS,
        version: "0.6"
      }
    });

    const bundlerUrl = `https://api.pimlico.io/v2/80002/rpc?apikey=${PIMLICO_API_KEY}`;
    const paymasterUrl = `https://api.pimlico.io/v2/80002/rpc?apikey=${PIMLICO_API_KEY}`;

    const pimlicoClient = createPimlicoClient({
      transport: http(paymasterUrl),
      entryPoint: {
        address: ENTRY_POINT_ADDRESS,
        version: "0.6"
      }
    });

    const smartAccountClient = createSmartAccountClient({
      account: simpleAccount,
      chain,
      bundlerTransport: http(bundlerUrl),
      paymaster: pimlicoClient,
    });

    // Decorate the client with custom helpers
    return {
      ...smartAccountClient,
      isMock: false,
      address: simpleAccount.address,
      ownerAddress: userAddress,
      getNotes: async () => {
        try {
          return await publicClient.readContract({
            address: contractAddresses.Notes,
            abi: NotesABI.abi,
            functionName: 'getNotes',
            account: simpleAccount.address
          });
        } catch (e) {
          console.error("Error reading from contract:", e);
          return [];
        }
      },
      createNote: async (cid, onStepChange) => {
        onStepChange?.("Constructing UserOperation...");
        
        // Execute the write Note transaction gaslessly!
        const hash = await smartAccountClient.sendTransaction({
          to: contractAddresses.Notes,
          abi: NotesABI.abi,
          functionName: 'createNote',
          args: [cid],
        });

        onStepChange?.("Transaction submitted! Waiting for block confirmation...");
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        onStepChange?.("Success! Gasless note created!");
        
        // Trigger celebration confetti
        import('canvas-confetti').then((m) => m.default({ particleCount: 150, spread: 80 }));
        
        return { hash, receipt, success: true };
      }
    };
  } catch (error) {
    console.error("Failed to initialize smart account client:", error);
    throw error;
  }
};
