// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { initSmartAccount } from './utils/web3';
import { uploadNoteToIPFS, fetchNoteMetadata } from './utils/pinata';

// Import Views
import OnboardingView from './components/OnboardingView';
import DashboardView from './components/DashboardView';
import NoteEditor from './components/NoteEditor';
import ProfileSettings from './components/ProfileSettings';

function App() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();

  // Local App State
  const [smartAccount, setSmartAccount] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard", "editor", "profile"
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSteps, setSaveSteps] = useState("");
  const [isInitializingAccount, setIsInitializingAccount] = useState(false);

  // Get active Privy embedded wallet
  const embeddedWallet = wallets?.find((w) => w.walletClientType === 'privy');

  // Initialize Account Abstraction Smart Account Client
  const loadSmartAccount = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) return;
    
    setIsInitializingAccount(true);
    try {
      let provider = null;
      if (embeddedWallet) {
        provider = await embeddedWallet.getEthereumProvider();
      }
      
      const client = await initSmartAccount(provider, user.wallet.address);
      setSmartAccount(client);
    } catch (err) {
      console.error("Failed to initialize smart account:", err);
    } finally {
      setIsInitializingAccount(false);
    }
  }, [authenticated, user, embeddedWallet]);

  // Load smart account once authenticated and wallets are ready
  useEffect(() => {
    if (ready && authenticated && user && wallets.length > 0 && !smartAccount && !isInitializingAccount) {
      loadSmartAccount();
    }
  }, [ready, authenticated, user, wallets, smartAccount, isInitializingAccount, loadSmartAccount]);

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
    if (!smartAccount) return;

    setIsSaving(true);
    setSaveSteps("Uploading note details to decentralized IPFS...");

    try {
      // 1. Upload note contents to IPFS to receive a deterministic metadata CID
      const { metadataCID } = await uploadNoteToIPFS(title, content, imageFile);

      // 2. Create the note on-chain gaslessly
      await smartAccount.createNote(metadataCID, (stepMessage) => {
        setSaveSteps(stepMessage);
      });

      // 3. Refresh note feed
      await fetchNotes();
      
      // Close editor and return to dashboard
      setSelectedNote(null);
      setActiveView("dashboard");
    } catch (err) {
      console.error("Error saving note securely:", err);
      alert("Failed to save note: " + err.message);
    } finally {
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

  // Render Loading state while Privy initializes
  if (!ready || (authenticated && isInitializingAccount && !smartAccount)) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-primary" />
        <h3 className="font-headline font-bold text-on-surface text-base animate-pulse">
          Initializing Web3 Signer...
        </h3>
      </div>
    );
  }

  // Onboarding / Login View
  if (!authenticated) {
    return <OnboardingView onLogin={login} isLoggingIn={!ready} />;
  }

  // Profile Settings View
  if (activeView === "profile") {
    return (
      <ProfileSettings
        userAddress={user?.wallet?.address}
        smartAccountAddress={smartAccount?.address}
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
    />
  );
}

export default App;
