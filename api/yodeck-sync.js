export default async function handler(req, res) {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET request to confirm the endpoint is live
  if (req.method === 'GET') {
    return res.status(200).json({ message: "Yodeck Sync API is working." });
  }

  // Handle POST request (for syncing content later)
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    console.log('Received sync request:', { businessId, businessName, content });

    // Validate structure
    if (!businessId || !Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload structure"
      });
    }

    // Simulate syncing content to Yodeck (for now)
    const results = content.map(item => ({
      contentId: item.id,
      yodeckMediaId: `yodeck-${Date.now()}`,
      status: "success"
    }));

    return res.status(200).json({
      success: true,
      details: {
        businessId,
        businessName,
        syncedCount: results.length,
        syncedItems: results
      }
    });

  } catch (error) {
    console.error('Yodeck sync error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
