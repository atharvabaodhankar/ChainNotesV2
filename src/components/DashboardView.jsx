// src/components/DashboardView.jsx
import React, { useState, useMemo } from 'react';

export default function DashboardView({ 
  notes, 
  loadingNotes, 
  userAddress, 
  smartAccountAddress, 
  isMock,
  onLogout, 
  onSelectNote, 
  onCreateNew, 
  onViewProfile,
  hasEmbeddedWallet,
  onCreateWallet,
  isCreatingWallet
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedText, setCopiedText] = useState("");

  // Clean, truncated address for display
  const truncateAddr = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 1500);
  };

  // Filter notes based on title/content search
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const titleMatch = note.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const contentMatch = note.content?.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || contentMatch;
    });
  }, [notes, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex text-zinc-800 font-sans relative overflow-hidden">
      
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#f7f7f8] border-r border-zinc-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header: Account Profile */}
        <div className="p-4 border-b border-zinc-200/80">
          <div 
            onClick={onViewProfile} 
            className="flex items-center gap-3 cursor-pointer hover:bg-zinc-200/50 p-2 rounded-lg transition-colors duration-150 group"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-95 transition-transform duration-200">
              {smartAccountAddress ? smartAccountAddress.substring(2, 4).toUpperCase() : "AA"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-800 text-xs truncate flex items-center gap-1.5">
                <span>Personal Space</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMock ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isMock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {truncateAddr(smartAccountAddress || userAddress)}
              </p>
            </div>
            <span className="material-symbols-outlined text-zinc-400 text-base opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              settings
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Workspace</span>
          </div>

          <button 
            onClick={() => setSearchQuery("")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-200/50 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-left bg-zinc-200/30"
          >
            <span className="material-symbols-outlined text-zinc-500 text-base">description</span>
            <span>All Secured Notes</span>
            <span className="ml-auto bg-zinc-200/80 text-zinc-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono">
              {notes.length}
            </span>
          </button>

          <button 
            onClick={onViewProfile}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-200/50 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-zinc-500 text-base">vpn_key</span>
            <span>Web3 Identity Specs</span>
          </button>

          <button 
            onClick={onCreateNew}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-200/50 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-left border-none"
          >
            <span className="material-symbols-outlined text-zinc-500 text-base">add_circle</span>
            <span>New Blank Page</span>
          </button>
        </div>

        {/* Sidebar Web3 Account Quick Details & Action */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>Security Panel</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] tracking-widest ${
                isMock ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
              }`}>
                {isMock ? 'Sandbox' : 'Amoy'}
              </span>
            </div>

            {smartAccountAddress && (
              <div className="bg-white border border-zinc-200 rounded-lg p-2 flex items-center justify-between text-[11px] font-mono shadow-2xs hover:border-zinc-300 transition-colors duration-150">
                <div className="min-w-0 flex-1">
                  <span className="text-zinc-400 block text-[9px] uppercase font-sans font-bold">Smart Wallet</span>
                  <span className="text-zinc-700 block truncate">{truncateAddr(smartAccountAddress)}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(smartAccountAddress, 'sa')}
                  className="p-1 hover:bg-zinc-150 text-zinc-450 hover:text-zinc-800 rounded transition-colors duration-150 border-none cursor-pointer"
                  title="Copy smart account address"
                >
                  <span className="material-symbols-outlined text-xs">
                    {copiedText === 'sa' ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-600 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTENT ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        
        {/* Top Header Navigation */}
        <header className="sticky top-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-250/70 h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors duration-150 cursor-pointer border-none"
              title="Toggle sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <span className="text-zinc-400">Workspace</span>
              <span className="text-zinc-300 text-sm">/</span>
              <span className="text-zinc-700 font-semibold">All Notes</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {smartAccountAddress && (
              <button 
                onClick={onCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-lg text-xs font-semibold transition-all duration-150 border-none cursor-pointer shadow-xs hover:shadow"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span className="hidden sm:inline">New Page</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-6 py-8 md:py-12">
          
          {/* Main Title & Search */}
          <div className="mb-8 space-y-4 animate-reveal stagger-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-zinc-450" style={{ fontVariationSettings: "'wght' 300" }}>folder_open</span>
              <span>All Secured Notes</span>
            </h1>
            
            {/* Elegant Borderless Search bar */}
            <div className="relative flex items-center bg-white border border-zinc-200/90 rounded-lg focus-within:border-zinc-300 focus-within:ring-1 focus-within:ring-zinc-300 transition-all duration-150 shadow-2xs">
              <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes securely indexing on IPFS..."
                className="w-full h-10 pl-10 pr-4 bg-transparent border-none text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 hover:bg-zinc-100 p-0.5 rounded text-zinc-450 border-none cursor-pointer flex items-center"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          {loadingNotes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse bg-white border border-zinc-200 rounded-lg p-5 h-32 flex flex-col justify-between shadow-2xs" />
              ))}
            </div>
          ) : !smartAccountAddress ? (
            /* Keyset status handler */
            hasEmbeddedWallet ? (
              /* Sync Session Banner */
              <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-5 animate-pop-in max-w-md mx-auto shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-2xs">
                  <span className="material-symbols-outlined text-2xl">sync_problem</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-zinc-850 text-base">Identity Sync Pending</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    We detected a secure wallet connected, but the active browser session requires syncing. Re-authenticating is required to verify identity state.
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="px-5 py-2.5 rounded-lg font-bold text-xs text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 shadow-2xs active:scale-[0.98] transition-all duration-150 border-none cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sync Session</span>
                </button>
              </div>
            ) : (
              /* Generate Secure Blockchain Keyset */
              <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-5 animate-pop-in max-w-md mx-auto shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-700 shadow-2xs">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 300" }}>key</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-zinc-900 text-base">Generate Blockchain Key</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    To write secure notes and authorize decentralized uploads, a deterministic smart keyset is required. This setup is fully gasless and automated.
                  </p>
                </div>
                <button
                  onClick={onCreateWallet}
                  disabled={isCreatingWallet}
                  className="px-5 py-2.5 rounded-lg font-bold text-xs text-white bg-zinc-900 hover:bg-zinc-800 shadow-2xs active:scale-[0.98] transition-all duration-150 border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingWallet ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Generating secure keys...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">vpn_key</span>
                      <span>Generate Keys</span>
                    </>
                  )}
                </button>
              </div>
            )
          ) : filteredNotes.length > 0 ? (
            /* Notes Grid Feed */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-reveal stagger-2">
              {filteredNotes.map((note, index) => {
                const noteDate = new Date(note.timestamp || Date.now());
                const formattedDate = noteDate.toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });

                return (
                  <div 
                    key={note.cid || index}
                    onClick={() => onSelectNote(note)}
                    className="notion-card-interactive bg-white border border-zinc-200/90 rounded-lg p-5 flex flex-col justify-between h-[135px] shadow-2xs hover:shadow-xs group hover:border-zinc-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between min-w-0">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-zinc-850 text-sm group-hover:text-zinc-950 transition-colors duration-150 line-clamp-1">
                          {note.title || "Untitled Note"}
                        </h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-normal">
                          {note.content || "No content provided."}
                        </p>
                      </div>
                      {note.imageUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-150 ml-3 bg-zinc-50 group-hover:opacity-95 transition-opacity">
                          <img src={note.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 mt-2">
                      <span className="text-[10px] text-zinc-400 font-semibold font-mono tracking-wide">
                        {formattedDate}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] text-zinc-400">
                          cloud_queue
                        </span>
                        <span className="text-[9px] text-zinc-400 font-extrabold tracking-widest font-mono uppercase">
                          IPFS
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Premium Empty State */
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-5 animate-pop-in max-w-sm mx-auto shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-450 shadow-2xs">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 300" }}>edit_document</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-zinc-900 text-base">No pages found</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px] mx-auto">
                  {searchQuery 
                    ? "Adjust your search terms to locate cached block indexes." 
                    : "Create your first decentralized card. It will be secured and saved permanently."
                  }
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold shadow-2xs active:scale-[0.98] transition-all duration-150 border-none cursor-pointer"
                >
                  Create First Note
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
