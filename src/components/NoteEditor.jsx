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

  // Determine vertical checklist state from saveSteps
  const getStepStatus = (stepName) => {
    const isSuccess = saveSteps && saveSteps.startsWith("SUCCESS:");
    if (isSuccess) return "complete";

    const currentMsg = (saveSteps || "").toLowerCase();

    if (stepName === "ipfs") {
      if (currentMsg.includes("ipfs")) return "active";
      if (currentMsg.includes("preparing") || currentMsg.includes("awaiting") || currentMsg.includes("submitting") || currentMsg.includes("validating") || currentMsg.length > 0) return "complete";
      return "pending";
    }

    if (stepName === "aa") {
      if (currentMsg.includes("preparing") || currentMsg.includes("awaiting")) return "active";
      if (currentMsg.includes("submitting") || currentMsg.includes("validating")) return "complete";
      return "pending";
    }

    if (stepName === "pimlico") {
      if (currentMsg.includes("submitting")) return "active";
      if (currentMsg.includes("validating")) return "complete";
      return "pending";
    }

    if (stepName === "chain") {
      if (currentMsg.includes("validating")) return "active";
      return "pending";
    }

    return "pending";
  };

  const renderStepIcon = (status) => {
    if (status === "complete") {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs z-10">
          <span className="material-symbols-outlined text-xs font-bold">check</span>
        </div>
      );
    }
    if (status === "active") {
      return (
        <div className="w-5 h-5 rounded-full bg-white border border-zinc-400 flex items-center justify-center shrink-0 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-ping" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-300 shrink-0 z-10">
        <div className="w-1 h-1 rounded-full bg-zinc-200" />
      </div>
    );
  };

  const renderStepClass = (status) => {
    if (status === "complete") return "text-zinc-800 font-semibold";
    if (status === "active") return "text-zinc-950 font-bold";
    return "text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between overflow-x-hidden relative animate-reveal">
      
      {/* ── TOP HEADER ACTIONS ─────────────────────────────── */}
      <header className="sticky top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 h-14 flex items-center">
        <div className="max-w-4xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors duration-150 cursor-pointer border-none disabled:opacity-50"
              title="Cancel edits"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-mono">
              {note ? "Workspace / Edit Note" : "Workspace / Draft Page"}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || (!title.trim() && !content.trim())}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-2xs active:scale-[0.98] transition-all duration-150 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">security</span>
            <span>Anchor Page</span>
          </button>
        </div>
      </header>

      {/* ── WRITING WORKSPACE BODY ──────────────────────────── */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 md:py-16 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3 text-xs flex items-center gap-2 animate-pop-in">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Note Title Input (Notion style - completely borderless) */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          disabled={isSaving}
          className="w-full bg-transparent border-none text-4xl font-extrabold tracking-tight text-zinc-900 placeholder:text-zinc-200 focus:outline-none focus:ring-0 px-0"
        />

        {/* Line divider */}
        <div className="h-[1px] bg-zinc-100 w-full" />

        {/* Note Body (Line-height relaxed, borderless textarea) */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing securely or type '/' for commands..."
          disabled={isSaving}
          rows={14}
          className="w-full bg-transparent border-none font-body text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-0 resize-none px-0 leading-relaxed"
        />

        {/* ── FILE BLOCK ATTACHMENT AREA ────────────────────── */}
        <div className="border-t border-zinc-150 pt-8 pb-16">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-400 text-sm">attach_file</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Media Block</span>
            </div>
            
            {!imagePreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="px-2.5 py-1 border border-zinc-250 hover:bg-zinc-50 rounded-md font-mono text-[9px] font-extrabold tracking-widest text-zinc-600 uppercase cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                Add Image
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {imagePreview ? (
            /* Uploaded Image Block Card */
            <div className="relative rounded-lg overflow-hidden border border-zinc-200 max-w-md aspect-video group shadow-2xs">
              <img src={imagePreview} alt="Attachment Preview" className="w-full h-full object-cover" />
              
              {!isSaving && (
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md bg-zinc-950/80 hover:bg-zinc-950 text-white cursor-pointer active:scale-90 transition-all duration-150 border-none shadow-sm"
                  title="Remove Asset"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          ) : (
            /* Dashed Notion Placeholder Dropzone */
            <div 
              onClick={() => !isSaving && fileInputRef.current?.click()}
              className="border border-dashed border-zinc-200 hover:border-zinc-300 rounded-lg p-5 text-center bg-zinc-50/50 cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-zinc-350 text-lg">add_photo_alternate</span>
              <span className="text-[11px] text-zinc-400 font-medium">Click to select and anchor an image layout</span>
            </div>
          )}
        </div>
      </main>

      {/* ── PREMIUM TRANSACTION TIMELINE OVERLAY ───────────── */}
      {isSaving && (() => {
        const isSuccess = saveSteps && saveSteps.startsWith("SUCCESS:");
        const txHash = isSuccess ? saveSteps.split(":")[1] : "";

        // Get status for each vertical pipeline step
        const ipfsStatus = getStepStatus("ipfs");
        const aaStatus = getStepStatus("aa");
        const pimlicoStatus = getStepStatus("pimlico");
        const chainStatus = getStepStatus("chain");

        return (
          <div className="fixed inset-0 z-50 bg-zinc-950/15 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200/90 rounded-xl p-6 w-full max-w-sm shadow-xl animate-pop-in space-y-6 flex flex-col relative z-55">
              
              {/* Header Status Flag */}
              <div className="flex flex-col items-center text-center space-y-4">
                {isSuccess ? (
                  <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs animate-pop-in">
                    <span className="material-symbols-outlined text-2xl font-bold">done_all</span>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-2xs">
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-300 border-t-zinc-800 animate-spin" />
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-sm">
                    {isSuccess ? "Page Anchored Successfully" : "Securing Page Payload"}
                  </h3>
                  <p className="text-[11px] text-zinc-500 max-w-[280px]">
                    {isSuccess 
                      ? "Your writing metadata is verified, encrypted, and immortalized." 
                      : "Resolving smart transaction signatures gaslessly in the background."}
                  </p>
                </div>
              </div>

              {/* ── VERTICAL DOT-TIMELINE PIPELINE ──────────────── */}
              <div className="bg-[#f7f7f8]/50 border border-zinc-200/80 rounded-lg p-4 space-y-4 relative overflow-hidden shadow-2xs">
                
                {/* Connecting pipeline line */}
                <div className="absolute left-[25px] top-[26px] bottom-[26px] w-[1px] bg-zinc-200 -z-0" />

                {/* Step 1: IPFS Upload */}
                <div className="flex items-start gap-3 relative z-10">
                  {renderStepIcon(ipfsStatus)}
                  <div className="space-y-0.5 min-w-0">
                    <p className={`text-[11px] font-medium leading-none ${renderStepClass(ipfsStatus)}`}>
                      IPFS Payload Compression
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate">
                      {ipfsStatus === "complete" ? "Pinned metadata JSON to Pinata nodes" : ipfsStatus === "active" ? "Uploading files..." : "Pending IPFS write"}
                    </p>
                  </div>
                </div>

                {/* Step 2: AA Preparation */}
                <div className="flex items-start gap-3 relative z-10">
                  {renderStepIcon(aaStatus)}
                  <div className="space-y-0.5 min-w-0">
                    <p className={`text-[11px] font-medium leading-none ${renderStepClass(aaStatus)}`}>
                      Account Abstraction Signing
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate">
                      {aaStatus === "complete" ? "UserOperation serialized successfully" : aaStatus === "active" ? "Signing block with embedded key..." : "Pending cryptographic signer"}
                    </p>
                  </div>
                </div>

                {/* Step 3: Pimlico Sponsorship */}
                <div className="flex items-start gap-3 relative z-10">
                  {renderStepIcon(pimlicoStatus)}
                  <div className="space-y-0.5 min-w-0">
                    <p className={`text-[11px] font-medium leading-none ${renderStepClass(pimlicoStatus)}`}>
                      Gas Sponsorship paymaster
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate">
                      {pimlicoStatus === "complete" ? "Fee coverage authorized gaslessly" : pimlicoStatus === "active" ? "Applying Pimlico sponsorship..." : "Pending paymaster review"}
                    </p>
                  </div>
                </div>

                {/* Step 4: Polygon Anchor */}
                <div className="flex items-start gap-3 relative z-10">
                  {renderStepIcon(chainStatus)}
                  <div className="space-y-0.5 min-w-0">
                    <p className={`text-[11px] font-medium leading-none ${renderStepClass(chainStatus)}`}>
                      Polygon Verification Loop
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate">
                      {isSuccess ? "Validated on Polygon" : chainStatus === "active" ? "Waiting for block inclusion..." : "Pending block confirmation"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Bottom Controls */}
              {isSuccess && (
                <div className="space-y-2">
                  <a
                    href={txHash.startsWith("0xMock") ? "#" : `https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 w-full border border-zinc-200 hover:bg-zinc-50 font-bold text-xs text-zinc-700 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs hover:border-zinc-300"
                    onClick={(e) => {
                      if (txHash.startsWith("0xMock")) {
                        e.preventDefault();
                        alert("Simulation Complete. Sandbox dev environment does not deploy to public chains.");
                      }
                    }}
                  >
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                    <span>{txHash.startsWith("0xMock") ? "View Simulated Payload" : "Verify on PolygonScan"}</span>
                  </a>
                  
                  <button
                    onClick={onClose}
                    className="py-2.5 w-full bg-zinc-900 hover:bg-zinc-800 font-bold text-xs text-white rounded-lg transition-all duration-150 cursor-pointer border-none shadow-sm hover:shadow"
                  >
                    Back to Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
