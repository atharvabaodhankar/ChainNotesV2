// src/utils/pinata.js
import DOMPurify from 'dompurify';

const GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL || "https://gateway.pinata.cloud";
const GATEWAY_TOKEN = import.meta.env.VITE_PINATA_GATEWAY_TOKEN || "";

// Build IPFS URL from CID
export const getIPFSUrl = (cid) => {
  if (!cid) return "";
  // Return direct URL if already a full HTTP address
  if (cid.startsWith("http://") || cid.startsWith("https://")) return cid;
  
  let url = `${GATEWAY_URL}/ipfs/${cid}`;
  if (GATEWAY_TOKEN) {
    url += `?pinataGatewayToken=${GATEWAY_TOKEN}`;
  }
  return url;
};

// File Validation before upload
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for notes assets

export function validateFile(file) {
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type "${file.type}" not allowed. Accepted: JPEG, PNG, GIF, WEBP`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB`);
  }
}

// Convert File helper to Base64 to send via serverless JSON request
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Extract the raw Base64 data (strip prefix "data:*/*;base64,")
      const base64Str = reader.result.split(',')[1];
      resolve(base64Str);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Upload a file securely via Vercel Serverless Function proxy
export async function uploadFile(file) {
  validateFile(file);

  try {
    const base64Data = await fileToBase64(file);
    
    const res = await fetch("/api/pinFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileData: base64Data,
        fileName: file.name,
        mimeType: file.type
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Error in uploadFile proxy:", error);
    // Graceful fallback during local development if API endpoints are not active yet
    if (import.meta.env.DEV) {
      console.warn("Dev mode: Serverless endpoint failed. Using mock IPFS file CID fallback.");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return "QmMockedImageCID" + Math.random().toString(36).substring(7);
    }
    throw error;
  }
}

// Upload JSON note content metadata securely via Vercel Serverless Function proxy
export async function uploadJSON(data, name = "note") {
  try {
    const res = await fetch("/api/pinJSON", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: `${name}-${Date.now()}` }
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `JSON upload failed: ${res.status}`);
    }

    const result = await res.json();
    return result.IpfsHash;
  } catch (error) {
    console.error("Error in uploadJSON proxy:", error);
    // Graceful fallback during local development if API endpoints are not active yet
    if (import.meta.env.DEV) {
      console.warn("Dev mode: Serverless endpoint failed. Using mock IPFS JSON CID fallback.");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const mockCID = "QmMockedNoteCID" + Math.random().toString(36).substring(7);
      
      // Store in local storage for instant mock retrieval in fallback
      const mockStore = JSON.parse(localStorage.getItem("chainnotes_mock_ipfs") || "{}");
      mockStore[mockCID] = JSON.stringify(data);
      localStorage.setItem("chainnotes_mock_ipfs", JSON.stringify(mockStore));
      
      return mockCID;
    }
    throw error;
  }
}

// Complete Note Upload (handles optional image file first)
export async function uploadNoteToIPFS(title, content, imageFile = null) {
  let imageCID = "";
  if (imageFile) {
    imageCID = await uploadFile(imageFile);
  }

  const noteMetadata = {
    title: title || "Untitled Note",
    content: content || "",
    image: imageCID ? `ipfs://${imageCID}` : "",
    imageUrl: imageCID ? getIPFSUrl(imageCID) : "",
    timestamp: Date.now(),
  };

  const metadataCID = await uploadJSON(noteMetadata, "note-metadata");
  return { metadataCID, imageCID };
}

// Fetch from IPFS (with public gateway fallbacks)
export async function fetchFromIPFS(cid) {
  // Check local mock storage first
  const mockStore = JSON.parse(localStorage.getItem("chainnotes_mock_ipfs") || "{}");
  if (mockStore[cid]) {
    return {
      ok: true,
      text: async () => mockStore[cid],
      headers: { get: () => "application/json" }
    };
  }

  try {
    const res = await fetch(getIPFSUrl(cid));
    if (res.ok) return res;
  } catch {
    console.warn("Private gateway failed, falling back to public gateways");
  }

  // Fallbacks
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    if (res.ok) return res;
  } catch {}

  return fetch(`https://ipfs.io/ipfs/${cid}`);
}

// IPFS content sanitization to prevent XSS
function sanitizeMetadata(raw) {
  if (typeof raw !== "object" || raw === null) return null;
  
  // Clean text fields to avoid XSS injections from untrusted IPFS CIDs
  const cleanTitle = typeof raw.title === "string" 
    ? DOMPurify.sanitize(raw.title.slice(0, 100)) 
    : "Untitled Note";
  const cleanContent = typeof raw.content === "string" 
    ? DOMPurify.sanitize(raw.content.slice(0, 50000)) 
    : "";

  return {
    title: cleanTitle,
    content: cleanContent,
    image: typeof raw.image === "string" && raw.image.startsWith("ipfs://") ? raw.image : "",
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    timestamp: typeof raw.timestamp === "number" ? raw.timestamp : Date.now(),
  };
}

// Fetch and parse Note metadata
export async function fetchNoteMetadata(cid) {
  try {
    const res = await fetchFromIPFS(cid);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const text = await res.text();
    if (text.trim().startsWith("{")) {
      const parsed = JSON.parse(text);
      return sanitizeMetadata(parsed) || { title: "Error parsing note", content: "", timestamp: Date.now() };
    }

    return { title: "Plain Text Note", content: text, timestamp: Date.now() };
  } catch (err) {
    console.error("IPFS note fetch error:", err);
    return { title: "Error fetching note", content: "This note's contents are temporarily unavailable on IPFS.", timestamp: Date.now(), isError: true };
  }
}
