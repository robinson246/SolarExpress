const { uploadTicketImageToPinata, uploadJSONToPinata, gatewayUrl, ipfsUri } = require('../services/pinataService');

async function uploadTicket(req, res) {
  try {
    const { svgString, name, description, externalUrl, attributes } = req.body;

    if (!svgString) {
      return res.status(400).json({ error: 'svgString is required' });
    }

    const imageCid = await uploadTicketImageToPinata(svgString, name || 'solarexpress-ticket');

    const metadata = {
      name: name || 'SolarExpress Ticket',
      description: description || 'Official SolarExpress Interplanetary Boarding Pass.',
      image: gatewayUrl(imageCid),
      external_url: externalUrl || 'https://solarexpress.app',
    };

    if (Array.isArray(attributes) && attributes.length > 0) {
      metadata.attributes = attributes;
    }

    const metadataCid = await uploadJSONToPinata(metadata);

    res.json({
      success: true,
      imageCid,
      metadataCid,
      metadataUri: ipfsUri(metadataCid),
      imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
    });
  } catch (err) {
    console.error('[NFT Controller] Upload failed:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

module.exports = { uploadTicket };
