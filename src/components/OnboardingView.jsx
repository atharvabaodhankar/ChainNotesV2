// src/components/OnboardingView.jsx
import React from 'react';

export default function OnboardingView({ onLogin, isLoggingIn }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-between px-6 py-12 md:py-20 relative overflow-hidden">
      {/* Decorative Notion-style Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Banner / Logo */}
      <div className="flex flex-col items-center space-y-6 mt-8 md:mt-16 text-center animate-reveal stagger-1 relative z-10">
        {/* Sleek Minimalist Shield Icon Box */}
        <div className="w-14 h-14 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm animate-pop-in">
          <span className="material-symbols-outlined text-[28px] text-zinc-800" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            shield
          </span>
        </div>
        
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-zinc-950">
            ChainNotes<span className="text-zinc-455 font-medium text-2xl ml-1">v2</span>
          </h1>
          <p className="font-body text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Sovereign writing meets decentralized security. Your notes are signed by account abstraction and pinned forever to IPFS.
          </p>
        </div>
      </div>

      {/* Feature Blocks (Notion Cards style) */}
      <div className="w-full max-w-md space-y-3.5 my-8 animate-reveal stagger-2 relative z-10">
        {/* Feature 1 */}
        <div className="notion-card p-4 flex items-start gap-3.5 bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors duration-150">
          <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-700 shrink-0">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 400" }}>
              fingerprint
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="font-headline font-semibold text-zinc-800 text-sm">Social Authenticated Signer</h4>
            <p className="font-body text-xs text-zinc-500 leading-normal">
              Sign in seamlessly with Google, Apple, or email. Privately generates secure cryptographic keys under the hood.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="notion-card p-4 flex items-start gap-3.5 bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors duration-150">
          <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-700 shrink-0">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 400" }}>
              electric_bolt
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="font-headline font-semibold text-zinc-800 text-sm">100% Sponsored, Gasless Transactions</h4>
            <p className="font-body text-xs text-zinc-500 leading-normal">
              Powered by ERC-4337 smart contracts. Paymasters sponsor all on-chain updates, meaning zero setup costs or native tokens required.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="notion-card p-4 flex items-start gap-3.5 bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors duration-150">
          <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-700 shrink-0">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 400" }}>
              cloud_queue
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="font-headline font-semibold text-zinc-800 text-sm">Decentralized IPFS Storage</h4>
            <p className="font-body text-xs text-zinc-500 leading-normal">
              Stores encrypted file blobs and JSON documents across distributed IPFS nodes via secure serverless pinning proxies.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA / Legal */}
      <div className="w-full max-w-md flex flex-col items-center space-y-6 animate-reveal stagger-3 relative z-10">
        <button
          onClick={onLogin}
          disabled={isLoggingIn}
          className="w-full py-3.5 rounded-lg font-headline font-bold text-sm text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 border-none cursor-pointer flex items-center justify-center gap-2.5 shadow-sm hover:shadow"
        >
          {isLoggingIn ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span>Initializing Privy Session...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 500" }}>lock_open</span>
              <span>Get Started with Social Login</span>
            </>
          )}
        </button>

        {/* Informational Sub-text */}
        <p className="font-label text-[10px] text-zinc-400 tracking-wider text-center max-w-[320px] leading-relaxed">
          SECURED BY DETERMINISTIC SMART CONTRACTS · ACTIVE ON POLYGON AMOY TESTNET
        </p>
      </div>
    </div>
  );
}
