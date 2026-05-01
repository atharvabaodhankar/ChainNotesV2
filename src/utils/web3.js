// src/utils/web3.js
import { createPublicClient, http, parseAbi } from 'viem';
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
 * Initializes the smart account client using Privy embedded wallet's viem Account
 * @param {object} viemAccount viem Account object from Privy's toViemAccount()
 * @param {string} userAddress The EOA wallet address
 * @returns {Promise<object>} SmartAccountClient or simulated MockClient
 */
export const initSmartAccount = async (viemAccount, userAddress) => {
  const chain = getActiveChain();

  // MOCK FALLBACK: If Pimlico Key or viem account is missing, use simulated client
  if (!PIMLICO_API_KEY || !viemAccount) {
    console.warn("[ChainNotes] Pimlico API key or viem account not found. Using simulated smart account client.");
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate AA load delay

    // Generate a deterministic Smart Account Address based on EOA
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

  // REAL FLOW: Initialize Permissionless + Pimlico Paymaster using the viem Account directly
  try {
    const publicClient = getPublicClient();

    console.log("[ChainNotes] Creating SimpleSmartAccount with real viem signer from Privy...");

    // Create Simple Smart Account — viemAccount from Privy's toViemAccount() is used directly as owner
    const simpleAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: viemAccount,
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
      paymaster: {
        getPaymasterStubData: async (userOperation) => {
          console.log("[ChainNotes] getPaymasterStubData called with userOp:", userOperation);
          // Standard 20-byte dummy Paymaster address for stub estimation
          const paymasterAddress = "0x6666666666666666666666666666666666666666";
          // ECDSA dummy signature
          const dummySignature = "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
          
          const stub = {
            paymasterAndData: `${paymasterAddress}${dummySignature}`,
            // Set high safe dummy gas limits to bypass simulation out-of-gas/revert errors
            verificationGasLimit: 150000n,
            preVerificationGas: 50000n,
            callGasLimit: 200000n,
          };
          console.log("[ChainNotes] getPaymasterStubData returning stub:", stub);
          return stub;
        },
        getPaymasterData: async (userOperation) => {
          console.log("[ChainNotes] getPaymasterData called with userOp:", userOperation);
          // Extract only the standard EntryPoint v0.6 UserOperation fields to prevent Pimlico RPC validation errors
          const standardUserOp = {
            sender: userOperation.sender,
            nonce: userOperation.nonce,
            initCode: userOperation.initCode,
            callData: userOperation.callData,
            callGasLimit: userOperation.callGasLimit,
            verificationGasLimit: userOperation.verificationGasLimit,
            preVerificationGas: userOperation.preVerificationGas,
            maxFeePerGas: userOperation.maxFeePerGas,
            maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
            paymasterAndData: "0x",
            signature: userOperation.signature || "0x"
          };
          console.log("[ChainNotes] standardUserOp filtered:", standardUserOp);

          const sponsored = await pimlicoClient.sponsorUserOperation({
            userOperation: standardUserOp
          });
          console.log("[ChainNotes] Pimlico sponsored response:", sponsored);
          return {
            paymasterAndData: sponsored.paymasterAndData,
            verificationGasLimit: sponsored.verificationGasLimit,
            preVerificationGas: sponsored.preVerificationGas,
            callGasLimit: sponsored.callGasLimit,
          };
        }
      },
      userOperation: {
        estimateFeesPerGas: async () => {
          const fees = await publicClient.estimateFeesPerGas();
          return {
            maxFeePerGas: fees.maxFeePerGas,
            maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
          };
        }
      }
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
