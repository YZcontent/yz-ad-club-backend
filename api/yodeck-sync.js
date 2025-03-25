export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    if (!businessId || !content || !Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload structure"
      });
    }

    const results = [];
    for (const item of content) {
      try {
        results.push({
          contentId: item.id,
          yodeckMediaId: `yodeck-${Date.now()}`,
          status: "success"
        });
      } catch (error) {
        results.push({
          contentId: item.id,
          status: "error",
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      details: {
        businessId,
        businessName,
        syncedCount: results.filter(r => r.status === "success").length,
        syncedItems: results
      }
    });

  } catch (error) {
    console.error('Error processing sync:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
