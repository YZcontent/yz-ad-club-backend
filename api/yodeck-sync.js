// File: /api/yodeck-sync.js

export default async function handler(req, res) {
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

    if (!businessId || !content || !Array.isArray(content)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const results = content.map((item) => ({
      contentId: item.id,
      yodeckMediaId: `yodeck-${Date.now()}`,
      status: "mocked-success"
    }));

    return res.status(200).json({
      success: true,
      syncedCount: results.length,
      syncedItems: results,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
