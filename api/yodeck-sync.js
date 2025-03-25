export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    // Temporary mock response
    return res.status(200).json({
      success: true,
      details: {
        syncedItems: content.map(c => ({
          contentId: c.id,
          status: "success",
          yodeckMediaId: `mock-${Date.now()}`
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
