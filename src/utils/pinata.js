// src/utils/pinata.js
import DOMPurify from 'dompurify';

const PINATA_CONFIG = {
  apiKey: import.meta.env.VITE_PINATA_API_KEY || "",
  apiSecret: import.meta.env.VITE_PINATA_API_SECRET || "",
  jwt: import.meta.env.VITE_PINATA_JWT || "",
};

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

// Upload a file (e.g. image attachments)
export async function uploadFile(file) {
  validateFile(file);
  
  // Graceful mockup fallback if no API keys are configured
  if (!PINATA_CONFIG.apiKey || !PINATA_CONFIG.apiSecret) {
    console.warn("Pinata API key/secret not configured. Using mock IPFS upload.");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
    return "QmMockedImageCID" + Math.random().toString(36).substring(7);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataMetadata", JSON.stringify({
    name: `chainnotes-asset-${Date.now()}`,
    keyvalues: { type: "attachment", timestamp: Date.now().toString() },
  }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: PINATA_CONFIG.apiKey,
      pinata_secret_api_key: PINATA_CONFIG.apiSecret,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(`IPFS file upload failed: ${res.status}`);
  return (await res.json()).IpfsHash;
}

// Upload JSON note content metadata
export async function uploadJSON(data, name = "note") {
  // Graceful mockup fallback if no JWT is configured
  if (!PINATA_CONFIG.jwt) {
    console.warn("Pinata JWT not configured. Using mock IPFS JSON upload.");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
    const mockCID = "QmMockedNoteCID" + Math.random().toString(36).substring(7);
    
    // Store in local storage for instant mock retrieval
    const mockStore = JSON.parse(localStorage.getItem("chainnotes_mock_ipfs") || "{}");
    mockStore[mockCID] = JSON.stringify(data);
    localStorage.setItem("chainnotes_mock_ipfs", JSON.stringify(mockStore));
    
    return mockCID;
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_CONFIG.jwt}`,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: { name: `${name}-${Date.now()}` },
      pinataOptions: { cidVersion: 0 },
    }),
  });

  if (!res.ok) throw new Error(`IPFS JSON upload failed: ${res.status}`);
  return (await res.json()).IpfsHash;
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
  
  // Use DOMPurify to clean text fields to avoid XSS injections from untrusted IPFS CIDs
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
