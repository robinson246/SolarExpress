const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API = 'https://api.pinata.cloud';
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud';

function requireAuth() {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT environment variable is not set');
  }
}

async function uploadSvgToPinata(svgString, name) {
  requireAuth();

  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const formData = new FormData();
  formData.append('file', blob, `${safeName}.svg`);

  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Pinata SVG upload failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return data.IpfsHash;
}

async function uploadJSONToPinata(json) {
  requireAuth();

  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(json),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Pinata JSON upload failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return data.IpfsHash;
}

function ipfsUri(cid) {
  return `ipfs://${cid}`;
}

function gatewayUrl(cid) {
  return `${IPFS_GATEWAY}/ipfs/${cid}`;
}

module.exports = { uploadSvgToPinata, uploadJSONToPinata, ipfsUri, gatewayUrl };
