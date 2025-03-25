export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    console.log("Incoming Yodeck Sync:", { businessId, businessName, content });

    const results = [];

    for (const item of content) {
      try {
        // Simulate Yodeck upload – replace this with actual API call later
        results.push({
          contentId: item.id,
          status: "success",
          yodeckMediaId: `mock-id-${Date.now()}`
        });
      } catch (err) {
        results.push({
          contentId: item.id,
          status: "error",
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      details: {
        businessId,
        syncedCount: results.filter(r => r.status === "success").length,
        syncedItems: results
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
