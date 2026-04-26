// src/components/OnboardingView.jsx
import React from 'react';

export default function OnboardingView({ onLogin, isLoggingIn }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-between px-8 py-16 overflow-hidden relative">
      {/* Background Ambient Blobs */}
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[110px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[420px] h-[420px] bg-secondary/8 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      
      {/* Header Logo + Title */}
      <div className="flex flex-col items-center space-y-6 mt-16 text-center animate-reveal">
        {/* Glow Logo Container */}
        <div className="w-20 h-20 rounded-2xl signature-gradient flex items-center justify-center shadow-primary animate-float">
          <span className="material-symbols-outlined text-[42px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
        </div>
        
        <div>
          <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface bg-gradient-to-br from-on-surface to-on-surface-variant/80 bg-clip-text">
            ChainNotes<span className="text-primary font-medium text-4xl ml-1">v2</span>
          </h1>
          <p className="font-body text-base text-on-surface-variant max-w-[280px] mx-auto mt-2">
            Production-grade Web3 Note-taking. Web2 UX meets sovereign ownership.
          </p>
        </div>
      </div>

      {/* Feature Row List */}
      <div className="w-full max-w-sm space-y-4 animate-reveal stagger-2">
        {/* Feature Item 1 */}
        <div className="glass-card rounded-xl p-4 flex items-start gap-4 border border-white/[0.05]">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              google
            </span>
          </div>
          <div>
            <h4 className="font-headline font-semibold text-on-surface text-sm">Social Auth</h4>
            <p className="font-body text-xs text-on-surface-variant">Log in securely with Google or email. Zero seed phrases.</p>
          </div>
        </div>

        {/* Feature Item 2 */}
        <div className="glass-card rounded-xl p-4 flex items-start gap-4 border border-white/[0.05]">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <div>
            <h4 className="font-headline font-semibold text-on-surface text-sm">Gasless & Sponsored</h4>
            <p className="font-body text-xs text-on-surface-variant">ERC-4337 Smart accounts sponsor 100% of your gas fees.</p>
          </div>
        </div>

        {/* Feature Item 3 */}
        <div className="glass-card rounded-xl p-4 flex items-start gap-4 border border-white/[0.05]">
          <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud
            </span>
          </div>
          <div>
            <h4 className="font-headline font-semibold text-on-surface text-sm">Decentralized IPFS Storage</h4>
            <p className="font-body text-xs text-on-surface-variant">Notes are pinned to IPFS via Pinata. Sovereign identity encryption.</p>
          </div>
        </div>
      </div>

      {/* Login CTA & Legal Footer */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-6 animate-reveal stagger-3">
        <button
          onClick={onLogin}
          disabled={isLoggingIn}
          className="w-full py-5 rounded-full font-headline font-bold text-lg text-on-primary-fixed signature-gradient shadow-primary active:scale-95 hover:opacity-95 transition-all duration-200 border-none cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLoggingIn ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-on-primary-fixed/20 border-t-on-primary-fixed animate-spin" />
              <span>Authenticating Signer...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
              <span>Sign In with Privy</span>
            </>
          )}
        </button>

        {/* Micro Legal Copy */}
        <p className="font-label text-[10px] text-on-surface-variant/40 tracking-wider text-center max-w-[280px]">
          Deterministic Safe smart contract wallets will be deployed gaslessly on Polygon network.
        </p>
      </div>
    </div>
  );
}
