const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let body = '';
  try {
    // Parse raw stream from Vercel serverless
    for await (const chunk of req) {
      body += chunk;
    }
    req.body = JSON.parse(body);
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  const { businessId, businessName, content } = req.body;

  if (!Array.isArray(content)) {
    return res.status(400).json({ success: false, message: 'Content must be an array' });
  }

  const label = process.env.YODECK_API_LABEL;
  const token = process.env.YODECK_API_TOKEN;

  if (!label || !token) {
    return res.status(500).json({ success: false, message: 'Missing Yodeck credentials' });
  }

  const authHeader = `Token ${label}:${token}`;
  const results = [];

  for (const item of content) {
    try {
      const mediaPayload = {
        title: item.title || 'Untitled',
        media_type: item.content_type || 'image',
        source_url: item.file_url,
        description: item.description || '',
        tags: [businessName || 'YZ Club']
      };

      const yodeckRes = await fetch('https://api.yodeck.com/media/', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mediaPayload)
      });

      const data = await yodeckRes.json();

      if (!yodeckRes.ok) {
        results.push({
          contentId: item.id,
          status: 'error',
          error: data?.detail || data?.message || 'Unknown Yodeck error'
        });
      } else {
        results.push({
          contentId: item.id,
          status: 'success',
          yodeckId: data.id
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
};
