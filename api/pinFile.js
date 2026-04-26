// api/pinFile.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileData, fileName, mimeType } = req.body;
  if (!fileData) {
    return res.status(400).json({ error: 'Missing file data' });
  }

  try {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return res.status(500).json({ error: 'Server configuration missing API credentials' });
    }

    // Decode Base64 string to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Construct FormData to send to Pinata
    const formData = new FormData();
    const fileBlob = new Blob([buffer], { type: mimeType });
    formData.append("file", fileBlob, fileName || 'upload');
    formData.append("pinataMetadata", JSON.stringify({
      name: `chainnotes-asset-${Date.now()}`,
      keyvalues: { type: "attachment", timestamp: Date.now().toString() },
    }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Pinata error: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json({ IpfsHash: data.IpfsHash });
  } catch (error) {
    console.error("Error pinning file:", error);
    return res.status(500).json({ error: error.message });
  }
}
