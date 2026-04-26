// api/pinJSON.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pinataContent, pinataMetadata } = req.body;
  if (!pinataContent) {
    return res.status(400).json({ error: 'Missing content data' });
  }

  try {
    const PINATA_JWT = process.env.PINATA_JWT;

    if (!PINATA_JWT) {
      return res.status(500).json({ error: 'Server configuration missing JWT credential' });
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent,
        pinataMetadata,
        pinataOptions: { cidVersion: 0 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Pinata error: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json({ IpfsHash: data.IpfsHash });
  } catch (error) {
    console.error("Error pinning JSON:", error);
    return res.status(500).json({ error: error.message });
  }
}
