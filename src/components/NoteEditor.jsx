// src/components/NoteEditor.jsx
import React, { useState, useRef } from 'react';

export default function NoteEditor({ note, onSave, onClose, isSaving, saveSteps }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(note?.imageUrl || "");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // File picker handler
  const handleImageChange = (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file size and MIME type
      const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!ALLOWED.includes(file.type)) {
        throw new Error("File type not supported. Use JPEG, PNG, GIF, or WEBP.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large. Max size is 5MB.");
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      setError("Please write a title or some content first.");
      return;
    }
    onSave(title, content, imageFile);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between overflow-x-hidden relative animate-reveal">
      {/* Background Ambient Blobs */}
      <div className="fixed top-[15%] -left-24 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-[10%] -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

      {/* Top Header Actions */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-surface/50 backdrop-blur-xl border-b border-white/[0.05] py-4">
        <div className="max-w-lg mx-auto w-full px-6 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>

          <h3 className="font-headline font-bold text-on-surface text-base">
            {note ? "Edit Secure Note" : "New Secure Note"}
          </h3>

          <button
            onClick={handleSave}
            disabled={isSaving || (!title.trim() && !content.trim())}
            className="px-6 h-10 rounded-full font-headline font-bold text-xs text-on-primary-fixed signature-gradient shadow-primary hover:opacity-90 active:scale-95 transition-all duration-200 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
            <span>Save Securely</span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 page-container mt-6 px-6">
        {error && (
          <div className="glass-card rounded-xl border-error/20 bg-error/5 text-error text-xs p-4 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          disabled={isSaving}
          className="w-full bg-transparent border-none text-2xl font-headline font-extrabold text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-0 mb-4 px-0"
        />

        {/* Note Body Input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Securely write note details stored off-chain on IPFS..."
          disabled={isSaving}
          rows={10}
          className="w-full bg-transparent border-none font-body text-base text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-0 resize-none px-0 leading-relaxed"
        />

        {/* Image Upload Row */}
        <div className="border-t border-white/[0.05] pt-6 mt-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">image</span>
              <span className="section-label">Media Attachment</span>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 font-label text-[10px] font-extrabold tracking-widest text-on-surface uppercase cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              Attach Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden glass-card border border-white/10 aspect-video max-w-sm group">
              <img src={imagePreview} alt="Attachment Preview" className="w-full h-full object-cover" />
              
              {!isSaving && (
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer active:scale-90 transition-transform duration-150 border-none"
                  title="Remove Asset"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Multi-stage Transaction Steps Sheet */}
      {isSaving && (() => {
        const isSuccess = saveSteps && saveSteps.startsWith("SUCCESS:");
        const txHash = isSuccess ? saveSteps.split(":")[1] : "";

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end justify-center">
            <div className="w-full max-w-lg glass-elevated rounded-t-3xl p-8 border-t border-white/10 animate-reveal">
              
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex flex-col items-center text-center space-y-6">
                {/* Visual indicator (Spinner or Success Checkmark) */}
                {isSuccess ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-4 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-reveal">
                    <span className="material-symbols-outlined text-3xl text-emerald-500 font-bold">
                      check
                    </span>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin relative flex items-center justify-center shadow-primary">
                    <span className="material-symbols-outlined text-xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                      security
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-headline font-bold text-on-surface text-lg">
                    {isSuccess ? "Note Secured On-Chain!" : "Securing Note State"}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant max-w-[280px] mx-auto mt-2">
                    {isSuccess 
                      ? "Your note is fully encrypted, uploaded to IPFS, and anchored to the blockchain." 
                      : "Account Abstraction handles sponsored transactions gaslessly in the background."}
                  </p>
                </div>

                {/* Step Logs */}
                <div className="w-full glass-subtle rounded-xl p-4 border border-white/[0.04]">
                  <p className={`font-body text-xs font-medium ${isSuccess ? 'text-emerald-400' : 'text-secondary animate-pulse'}`}>
                    {isSuccess ? "Decentralized metadata pinned successfully." : saveSteps || "Preparing UserOperation..."}
                  </p>
                </div>

                {/* Dynamic Actions: Progress Logs or Verification Links */}
                {isSuccess ? (
                  <div className="w-full space-y-3">
                    <a
                      href={txHash.startsWith("0xMock") ? "#" : `https://amoy.polygonscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-3 w-full rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 font-headline font-bold text-xs text-primary transition-all duration-200 cursor-pointer select-none active:scale-[0.98]"
                      onClick={(e) => {
                        if (txHash.startsWith("0xMock")) {
                          e.preventDefault();
                          alert("This is a simulated transaction in sandboxed dev mode. In a live environment, this links directly to the Polygon Amoy block explorer!");
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>{txHash.startsWith("0xMock") ? "View Simulated Transaction" : "Verify on PolygonScan"}</span>
                    </a>
                    
                    <button
                      onClick={onClose}
                      className="py-3 w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-headline font-bold text-xs text-on-surface transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center gap-1">
                    <div className="h-1 flex-1 bg-primary rounded-full animate-pulse" />
                    <div className="h-1 flex-1 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                    <div className="h-1 flex-1 bg-tertiary rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
