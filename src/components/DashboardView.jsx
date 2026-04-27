// src/components/DashboardView.jsx
import React, { useState, useMemo } from 'react';

export default function DashboardView({ 
  notes, 
  loadingNotes, 
  userAddress, 
  smartAccountAddress, 
  onLogout, 
  onSelectNote, 
  onCreateNew, 
  onViewProfile 
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Clean, truncated address for display
  const truncateAddr = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
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
    <div className="min-h-screen bg-surface relative overflow-x-hidden pb-32">
      {/* Background Ambient Blobs */}
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-primary/8 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

      {/* Floating Header */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-surface/50 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3" onClick={onViewProfile} className="cursor-pointer flex items-center gap-3">
          <div className="w-10 h-10 rounded-full signature-gradient flex items-center justify-center font-headline font-bold text-on-primary-fixed shadow-secondary">
            {smartAccountAddress ? smartAccountAddress.substring(2, 4).toUpperCase() : "AA"}
          </div>
          <div>
            <h3 className="font-headline font-bold text-on-surface text-sm flex items-center gap-1.5">
              <span>My Account</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </h3>
            <p className="font-body text-[11px] text-on-surface-variant">
              Smart Account: {truncateAddr(smartAccountAddress)}
            </p>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all duration-200 cursor-pointer active:scale-95"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="page-container mt-6">
        
        {/* Search Bar Container */}
        <div className="relative group glass-card rounded-2xl border border-white/[0.05] focus-within:ring-2 focus-within:ring-secondary/40 focus-within:border-secondary/60 transition-all duration-200 mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes indexing..."
            className="w-full h-14 pl-12 pr-6 bg-transparent border-none font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              folder_open
            </span>
            <span className="section-label">All Secured Notes ({filteredNotes.length})</span>
          </div>
        </div>

        {/* Notes Grid Feed */}
        {loadingNotes ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse glass-card border border-white/[0.05] rounded-xl p-5 h-24" />
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 animate-reveal">
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
                  className="glass-card rounded-xl p-5 border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200 cursor-pointer flex flex-col justify-between h-[120px] group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-headline font-bold text-on-surface text-base group-hover:text-primary transition-colors duration-150 line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="font-body text-xs text-on-surface-variant line-clamp-1 mt-1">
                        {note.content || "Empty content"}
                      </p>
                    </div>
                    {note.imageUrl && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 ml-3">
                        <img src={note.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 mt-2">
                    <span className="font-label text-[10px] text-on-surface-variant/40 tracking-wider">
                      {formattedDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[10px] text-outline">
                        public
                      </span>
                      <span className="font-label text-[10px] text-on-surface-variant/40 tracking-widest uppercase">
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
          <div className="glass-card rounded-2xl border border-white/[0.05] p-12 text-center flex flex-col items-center justify-center space-y-6 mt-8 animate-reveal">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-outline-variant/15 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl">edit_document</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface text-lg">No notes found</h3>
              <p className="font-body text-xs text-on-surface-variant max-w-[240px] mx-auto mt-2">
                {searchQuery 
                  ? "No notes matched your search query. Try adjusting your keywords." 
                  : "Start creating your first secure decentralized note stored on IPFS blockchain."
                }
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={onCreateNew}
                className="px-6 py-3 rounded-full font-headline font-bold text-xs text-on-primary-fixed signature-gradient shadow-primary hover:opacity-90 active:scale-95 transition-all duration-200 border-none cursor-pointer"
              >
                Create First Note
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={onCreateNew}
        className="fixed bottom-8 right-6 w-14 h-14 rounded-full signature-gradient shadow-primary flex items-center justify-center text-on-primary-fixed border-none cursor-pointer hover:opacity-90 active:scale-90 transition-all duration-200 z-30"
        title="Create Note"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </button>
    </div>
  );
}
