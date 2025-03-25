import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const YODECK_API_TOKEN = process.env.YODECK_API_TOKEN;
  const YODECK_API_LABEL = process.env.YODECK_API_LABEL;

  if (!YODECK_API_TOKEN || !YODECK_API_LABEL) {
    return res.status(500).json({
      success: false,
      message: 'Missing Yodeck credentials'
    });
  }

  try {
    const { businessId, businessName, content } = req.body;

    const results = [];

    for (const item of content) {
      try {
        const yodeckPayload = {
          name: item.title,
          notes: item.description || '',
          duration: item.duration || 30,
          media_type: item.content_type === 'video' ? 'video' : 'image',
          url: item.file_url,
          tags: [businessName, item.content_type],
          status: 'active'
        };

        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${YODECK_API_LABEL}:${YODECK_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(yodeckPayload)
        });

        const yodeckData = await yodeckRes.json();

        if (!yodeckRes.ok) {
          throw new Error(yodeckData?.detail || 'Yodeck API error');
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
      details: {
        businessId,
        businessName,
        syncedCount: results.filter(r => r.status === 'success').length,
        syncedItems: results
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
