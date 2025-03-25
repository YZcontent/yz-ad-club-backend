const fetch = require('node-fetch');

// Main API handler for Vercel
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight request support
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST is supported
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Try to parse the body
    const { businessId, businessName, content } = req.body || {};

    if (!Array.isArray(content)) {
      return res.status(400).json({ success: false, message: "Content must be an array" });
    }

    // Load Yodeck API credentials from environment
    const label = process.env.YODECK_API_LABEL;
    const token = process.env.YODECK_API_TOKEN;

    if (!label || !token) {
      return res.status(500).json({ success: false, message: "Missing Yodeck credentials" });
    }

    const authHeader = `Token ${label}:${token}`;
    const results = [];

    for (const item of content) {
      try {
        // Construct media upload payload for Yodeck
        const mediaPayload = {
          title: item.title || "Untitled",
          media_type: item.content_type || "image", // can be video/image/webpage
          source_url: item.file_url,
          description: item.description || "",
          tags: [businessName || "YZ Club"]
        };

        // Log for debugging
        console.log('Sending media to Yodeck:', mediaPayload);

        // Upload to Yodeck Media
        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaPayload)
        });

        const responseText = await yodeckRes.text();
        let data;

        try {
          data = JSON.parse(responseText);
        } catch (jsonErr) {
          results.push({
            contentId: item.id,
            status: 'error',
            error: `Invalid JSON response: ${responseText}`
          });
          continue;
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

  } catch (err) {
    console.error('Yodeck Sync Fatal Error:', err);
    return res.status(500).json({ success: false, message: 'Unexpected server error', error: err.message });
  }
};
