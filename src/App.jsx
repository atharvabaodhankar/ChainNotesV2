// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets, useCreateWallet, getEmbeddedConnectedWallet, toViemAccount } from '@privy-io/react-auth';
import { initSmartAccount } from './utils/web3';
import { uploadNoteToIPFS, fetchNoteMetadata } from './utils/pinata';

// Import Views
import OnboardingView from './components/OnboardingView';
import DashboardView from './components/DashboardView';
import NoteEditor from './components/NoteEditor';
import ProfileSettings from './components/ProfileSettings';

function App() {
  const { login, logout, authenticated, user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();

  // Local App State
  const [smartAccount, setSmartAccount] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard", "editor", "profile"
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSteps, setSaveSteps] = useState("");
  const [isInitializingAccount, setIsInitializingAccount] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Initialize Account Abstraction Smart Account Client
  const loadSmartAccount = useCallback(async () => {
    if (!authenticated) return;
    
    setIsInitializingAccount(true);
    try {
      // Find the Privy embedded wallet from the connected wallets array, or fallback to any EOA wallet
      let activeWallet = getEmbeddedConnectedWallet(wallets);
      
      console.log('[ChainNotes] walletsReady:', walletsReady);
      console.log('[ChainNotes] All wallets:', wallets?.map(w => ({ type: w.walletClientType, addr: w.address })));
      console.log('[ChainNotes] Embedded wallet:', activeWallet ? { type: activeWallet.walletClientType, addr: activeWallet.address } : 'NOT FOUND');
      
      if (!activeWallet && wallets && wallets.length > 0) {
        activeWallet = wallets[0];
        console.log('[ChainNotes] Fallback EOA wallet being used:', activeWallet.address);
      }

      if (!activeWallet) {
        console.warn('[ChainNotes] No wallet signer (embedded or EOA) available in wallets list yet');
        setIsInitializingAccount(false);
        return;
      }

      // Use Privy's toViemAccount to get a proper viem Account signer
      const viemAccount = await toViemAccount({ wallet: activeWallet });
      const userAddr = activeWallet.address;
      
      console.log('[ChainNotes] Got viem account from Privy wallet signer:', userAddr);
      
      const client = await initSmartAccount(viemAccount, userAddr);
      console.log('[ChainNotes] Smart account initialized:', { isMock: client.isMock, address: client.address });
      setSmartAccount(client);
    } catch (err) {
      console.error("Failed to initialize smart account:", err);
    } finally {
      setIsInitializingAccount(false);
    }
  }, [authenticated, wallets, walletsReady]);

  // Load smart account once wallets are ready and any connected wallet is available
  useEffect(() => {
    if (!privyReady || !walletsReady || !authenticated || !user || isInitializingAccount) return;
    
    const activeWallet = getEmbeddedConnectedWallet(wallets) || (wallets && wallets[0]);
    const currentIsMock = !smartAccount || smartAccount.isMock;
    
    console.log('[ChainNotes] useEffect check — walletsReady:', walletsReady, 'activeWallet:', !!activeWallet, 'currentIsMock:', currentIsMock);
    
    // Initialize when we have a connected wallet and either no smart account or upgrading from mock
    if (activeWallet && (!smartAccount || currentIsMock)) {
      console.log('[ChainNotes] Connected wallet ready, initializing real smart account...');
      loadSmartAccount();
    }
  }, [privyReady, walletsReady, authenticated, user, wallets, smartAccount, isInitializingAccount, loadSmartAccount]);

  // Dynamic wallet creation handler
  const handleCreateWallet = async () => {
    setIsCreatingWallet(true);
    try {
      const newWallet = await createWallet();
      console.log("[ChainNotes] Secure embedded wallet created successfully:", newWallet.address);
    } catch (err) {
      console.error("[ChainNotes] Failed to create secure embedded wallet:", err);
      alert("Keyset creation failed: " + err.message);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  // Helper to determine if user has a linked embedded wallet in their profile
  const hasEmbeddedWallet = !!user?.linkedAccounts?.some(
    (acc) => acc.type === 'wallet' && acc.connectorType === 'embedded'
  ) || !!user?.wallet;

  // Fetch Notes CIDs from smart contract, and retrieve details from IPFS
  const fetchNotes = useCallback(async () => {
    if (!smartAccount) return;

    setLoadingNotes(true);
    try {
      // 1. Fetch note CIDs array from smart account client (reads from Notes.sol)
      const cids = await smartAccount.getNotes();
      
      // 2. Fetch metadata from IPFS for each CID in parallel
      const fetchedNotes = await Promise.all(
        cids.map(async (cid) => {
          const metadata = await fetchNoteMetadata(cid);
          return {
            cid,
            ...metadata
          };
        })
      );

      // Sort notes by timestamp descending (newest first)
      const sorted = fetchedNotes.sort((a, b) => b.timestamp - a.timestamp);
      setNotes(sorted);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, [smartAccount]);

  // Trigger notes fetch once smart account is ready
  useEffect(() => {
    if (smartAccount) {
      fetchNotes();
    }
  }, [smartAccount, fetchNotes]);

  // Handle Note Save (Uploads metadata to IPFS, triggers sponsored contract write)
  const handleSaveNote = async (title, content, imageFile) => {
    if (!smartAccount) {
      alert("Smart Account is still initializing. Please wait a moment and try again.");
      return;
    }

    setIsSaving(true);
    setSaveSteps("Uploading note details to decentralized IPFS...");

    try {
      // 1. Upload note contents to IPFS to receive a deterministic metadata CID
      const { metadataCID } = await uploadNoteToIPFS(title, content, imageFile);

      // 2. Create the note on-chain gaslessly
      const tx = await smartAccount.createNote(metadataCID, (stepMessage) => {
        setSaveSteps(stepMessage);
      });

      // 3. Refresh note feed
      await fetchNotes();
      
      // If we got a valid transaction hash, show the success verification screen
      if (tx && tx.hash) {
        setSaveSteps(`SUCCESS:${tx.hash}`);
      } else {
        // Fallback if no transaction hash (should not happen)
        setSelectedNote(null);
        setActiveView("dashboard");
        setIsSaving(false);
        setSaveSteps("");
      }
    } catch (err) {
      console.error("Error saving note securely:", err);
      alert("Failed to save note: " + err.message);
      setIsSaving(false);
      setSaveSteps("");
    }
  };

  // Log-out handler
  const handleLogout = async () => {
    setSmartAccount(null);
    setNotes([]);
    await logout();
  };

  // Render Loading state while Privy or wallets are initializing
  if (!privyReady || !walletsReady || (authenticated && isInitializingAccount && !smartAccount)) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-primary" />
        <h3 className="font-headline font-bold text-on-surface text-base animate-pulse">
          {!privyReady ? 'Connecting to Privy...' : !walletsReady ? 'Loading Embedded Wallet...' : 'Initializing Web3 Signer...'}
        </h3>
      </div>
    );
  }

  // Onboarding / Login View
  if (!authenticated) {
    return <OnboardingView onLogin={login} isLoggingIn={!privyReady} />;
  }

  // Profile Settings View
  if (activeView === "profile") {
    return (
      <ProfileSettings
        userAddress={user?.wallet?.address}
        smartAccountAddress={smartAccount?.address}
        isMock={smartAccount?.isMock}
        onClose={() => setActiveView("dashboard")}
      />
    );
  }

  // Note Editor View (Create / Edit note)
  if (activeView === "editor") {
    return (
      <NoteEditor
        note={selectedNote}
        onSave={handleSaveNote}
        onClose={() => {
          setSelectedNote(null);
          setActiveView("dashboard");
          setIsSaving(false);
          setSaveSteps("");
        }}
        isSaving={isSaving}
        saveSteps={saveSteps}
      />
    );
  }

  // Dashboard View (Default Notes Feed)
  return (
    <DashboardView
      notes={notes}
      loadingNotes={loadingNotes}
      userAddress={user?.wallet?.address}
      smartAccountAddress={smartAccount?.address}
      isMock={smartAccount?.isMock}
      onLogout={handleLogout}
      onSelectNote={(note) => {
        setSelectedNote(note);
        setActiveView("editor");
      }}
      onCreateNew={() => {
        setSelectedNote(null);
        setActiveView("editor");
      }}
      onViewProfile={() => setActiveView("profile")}
      hasEmbeddedWallet={hasEmbeddedWallet}
      onCreateWallet={handleCreateWallet}
      isCreatingWallet={isCreatingWallet}
    />
  );
}

export default App;
