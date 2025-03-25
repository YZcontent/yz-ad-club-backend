import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    if (!businessId || !Array.isArray(content)) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }

    const YODECK_API_LABEL = process.env.YODECK_API_LABEL || 'ContentmanagerAPI';
    const YODECK_API_TOKEN = process.env.YODECK_API_TOKEN;

    if (!YODECK_API_TOKEN) {
      return res.status(500).json({ success: false, message: 'Missing Yodeck API token' });
    }

    const results = [];

    for (const item of content) {
      const mediaTypeMap = {
        image: 'image',
        video: 'video',
        pdf: 'pdf',
        promotion: 'image',
        advertisement: 'image'
      };

      const media_type = mediaTypeMap[item.content_type] || 'image';

      const payload = {
        title: item.title || `Media from ${businessName}`,
        media_type,
        source_url: item.file_url
      };

      try {
        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            Authorization: `Token ${YODECK_API_LABEL}:${YODECK_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const yodeckData = await yodeckRes.json();

        if (yodeckRes.ok && yodeckData.id) {
          results.push({
            contentId: item.id,
            status: 'success',
            yodeckId: yodeckData.id,
            yodeckTitle: yodeckData.title
          });
        } else {
          results.push({
            contentId: item.id,
            status: 'error',
            error: yodeckData?.detail || 'Upload failed',
            debug: yodeckData
          });
        }
      } catch (err) {
        results.push({
          contentId: item.id,
          status: 'error',
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      syncedCount: results.filter(r => r.status === 'success').length,
      syncedItems: results
    });

  } catch (error) {
    console.error('Unexpected error in yodeck-sync:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
