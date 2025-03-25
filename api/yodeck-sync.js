const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    await new Promise(resolve => req.on('end', resolve));
    
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
    }

    const { businessId, businessName, content } = payload;

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
        if (!item.file_url || !item.title) {
          throw new Error('Missing file_url or title');
        }

        const mediaPayload = {
          title: item.title || "Untitled",
          media_type: item.content_type || "image",
          source_url: item.file_url,
          description: item.description || "",
          tags: [businessName || "YZ Club"]
        };

        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaPayload)
        });

        const raw = await yodeckRes.text();

        let data;
        try {
          data = JSON.parse(raw);
        } catch (err) {
          throw new Error(`Invalid JSON response: ${raw}`);
        }

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
            yodeckId: data.id,
            name: data.name
          });
        }

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
      syncedCount: results.filter(r => r.status === 'success').length,
      syncedItems: results
    });

  } catch (error) {
    console.error("Yodeck Sync Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
