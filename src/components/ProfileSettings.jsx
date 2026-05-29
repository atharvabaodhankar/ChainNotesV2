// src/components/ProfileSettings.jsx
import React, { useState } from 'react';

export default function ProfileSettings({ 
  userAddress, 
  smartAccountAddress, 
  isMock,
  onClose 
}) {
  const [copiedEOA, setCopiedEOA] = useState(false);
  const [copiedAA, setCopiedAA] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'eoa') {
      setCopiedEOA(true);
      setTimeout(() => setCopiedEOA(false), 2000);
    } else {
      setCopiedAA(true);
      setTimeout(() => setCopiedAA(false), 2000);
    }
  };

  const getExplorerLink = (addr) => {
    return `https://amoy.polygonscan.com/address/${addr}`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between overflow-x-hidden relative animate-reveal text-zinc-800 font-sans">
      
      {/* ── TOP HEADER NAVIGATION ───────────────────────────── */}
      <header className="sticky top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 h-14 flex items-center">
        <div className="max-w-xl mx-auto w-full px-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors duration-150 cursor-pointer border-none"
            title="Go back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>

          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-mono">
            Settings / Web3 Identity
          </span>

          <div className="w-8 h-8" /> {/* Spacer */}
        </div>
      </header>

      {/* ── MAIN CONFIGURATION PANEL ───────────────────────── */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 py-8 space-y-6">
        
        {/* Page Title */}
        <div className="space-y-1.5 animate-reveal stagger-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Identity Settings
          </h1>
          <p className="text-xs text-zinc-500 leading-normal">
            View active signer keys, smart contract wallets, and network statuses assigned to this space.
          </p>
        </div>

        {/* Identity Overview Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center gap-4 shadow-2xs hover:border-zinc-300 transition-colors duration-150 animate-reveal stagger-2">
          <div className="w-12 h-12 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
            {smartAccountAddress ? smartAccountAddress.substring(2, 4).toUpperCase() : "AA"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-zinc-850 text-sm flex items-center gap-2">
              <span>Decentralized Space</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest ${
                isMock ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
              }`}>
                {isMock ? 'Sandbox' : 'Amoy Network'}
              </span>
            </h4>
            <p className="text-xs text-zinc-400 leading-normal mt-0.5">
              {isMock 
                ? "Operating in local simulation mode (Dev Sandbox). Standard paymaster actions are skipped."
                : "Identity and note indexes are secured natively using Polygon account abstraction."}
            </p>
          </div>
        </div>

        {/* Privy Signer EOA Settings Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3.5 shadow-2xs hover:border-zinc-300 transition-colors duration-150 animate-reveal stagger-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-450 text-base" style={{ fontVariationSettings: "'wght' 300" }}>key</span>
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">EOA Signer Key</span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            This embedded signer key was generated securely by Privy via your social account. It holds the signing authority for your decentralized smart account.
          </p>

          <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-3 border border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-700 truncate flex-1 select-all">
              {userAddress || "0x..."}
            </span>
            <button
              onClick={() => copyToClipboard(userAddress, 'eoa')}
              className="p-1.5 hover:bg-zinc-200/60 text-zinc-450 hover:text-zinc-850 rounded transition-colors duration-150 border-none cursor-pointer"
              title="Copy to clipboard"
            >
              <span className="material-symbols-outlined text-xs">
                {copiedEOA ? "check" : "content_copy"}
              </span>
            </button>
          </div>
        </div>

        {/* ERC-4337 Smart Account Settings Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3.5 shadow-2xs hover:border-zinc-300 transition-colors duration-150 animate-reveal stagger-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-450 text-base" style={{ fontVariationSettings: "'wght' 300" }}>shield</span>
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Smart Contract Address</span>
            </div>
            <span className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-500 text-[8px] font-bold rounded uppercase tracking-widest">
              ERC-4337
            </span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            This deterministic address anchors your notes. It is resolved dynamically on-chain and remains static across devices.
          </p>

          <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-3 border border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-700 truncate flex-1 select-all font-semibold">
              {smartAccountAddress || "0x..."}
            </span>
            <button
              onClick={() => copyToClipboard(smartAccountAddress, 'aa')}
              className="p-1.5 hover:bg-zinc-200/60 text-zinc-450 hover:text-zinc-850 rounded transition-colors duration-150 border-none cursor-pointer"
              title="Copy to clipboard"
            >
              <span className="material-symbols-outlined text-xs">
                {copiedAA ? "check" : "content_copy"}
              </span>
            </button>
          </div>

          {/* Verification Explorer Actions */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={getExplorerLink(smartAccountAddress)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-200 hover:bg-zinc-50 font-bold text-xs text-zinc-700 rounded-lg transition-colors duration-150 cursor-pointer shadow-2xs hover:border-zinc-300"
            >
              <span className="material-symbols-outlined text-xs">open_in_new</span>
              <span>Verify on PolygonScan</span>
            </a>
            
            <a
              href={`https://jiffyscan.xyz/address/${smartAccountAddress}?network=amoy`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-200 hover:bg-zinc-50 font-bold text-xs text-zinc-700 rounded-lg transition-colors duration-150 cursor-pointer shadow-2xs hover:border-zinc-300"
            >
              <span className="material-symbols-outlined text-xs">explore</span>
              <span>Lookup UserOperations</span>
            </a>
          </div>
        </div>
      </main>

      {/* ── FOOTER NETWORK FLAGS ────────────────────────────── */}
      <footer className="w-full max-w-xl mx-auto py-8 text-center text-[10px] text-zinc-400 font-semibold tracking-wider uppercase font-mono mt-auto">
        ChainNotes v2 · Polygon Amoy Testnet · Pimlico paymaster
      </footer>
    </div>
  );
}
