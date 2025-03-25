// File: /api/yodeck-sync.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const YODECK_API_TOKEN = process.env.YODECK_API_TOKEN;
  const YODECK_API_LABEL = process.env.YODECK_API_LABEL;

  if (!YODECK_API_TOKEN || !YODECK_API_LABEL) {
    return res.status(500).json({
      success: false,
      message: 'Missing Yodeck credentials in environment variables'
    });
  }

  try {
    const { businessId, businessName, content } = req.body;

    if (!businessId || !Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload structure'
      });
    }

    const results = [];

    for (const item of content) {
      try {
        const payload = {
          name: item.title || 'Untitled',
          description: item.description || '',
          type: item.content_type || 'image', // 'video', 'image', etc.
          source_url: item.file_url,
          tags: [businessName, businessId],
        };

        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${YODECK_API_LABEL}:${YODECK_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const yodeckData = await yodeckRes.json();

        if (!yodeckRes.ok) {
          throw new Error(yodeckData?.detail || 'Failed to upload media to Yodeck');
        }

        results.push({
          contentId: item.id,
          status: 'success',
          yodeckMediaId: yodeckData.id
        });
      } catch (error) {
        results.push({
          contentId: item.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      syncedItems: results
    });
  } catch (error) {
    console.error('Yodeck sync error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
