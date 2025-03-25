export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // CORS preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    if (!businessId || !Array.isArray(content)) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }

    const YODECK_TOKEN_LABEL = process.env.YODECK_API_LABEL;
    const YODECK_TOKEN_VALUE = process.env.YODECK_API_TOKEN;

    if (!YODECK_TOKEN_LABEL || !YODECK_TOKEN_VALUE) {
      return res.status(500).json({ success: false, message: 'Yodeck credentials not set' });
    }

    const results = [];

    for (const item of content) {
      try {
        const uploadResponse = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${YODECK_TOKEN_LABEL}:${YODECK_TOKEN_VALUE}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: item.title,
            description: item.description || '',
            file_url: item.file_url,
            duration: item.duration || 30,
            tags: [`business:${businessName}`, item.content_type],
            layout: 'FULL_SCREEN', // or based on content_type
            status: 'active'
          })
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.detail || 'Failed to upload content to Yodeck');
        }

        results.push({
          contentId: item.id,
          yodeckMediaId: uploadResult.id,
          status: 'success'
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
      message: 'Content synced to Yodeck',
      syncedCount: results.filter(r => r.status === 'success').length,
      results
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
