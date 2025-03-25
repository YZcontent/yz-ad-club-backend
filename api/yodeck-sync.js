const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { businessId, businessName, content } = body;

    if (!Array.isArray(content)) {
      return res.status(400).json({ success: false, message: "Content must be an array" });
    }

    const label = process.env.YODECK_API_LABEL;
    const token = process.env.YODECK_API_TOKEN;
    const authHeader = `Token ${label}:${token}`;

    if (!label || !token) {
      return res.status(500).json({ success: false, message: "Missing Yodeck API credentials" });
    }

    const results = [];

    for (const item of content) {
      try {
        // Build media payload
        const mediaPayload = {
          title: item.title || "Untitled",
          media_type: item.content_type || "image", // Yodeck: image, video, webpage, etc.
          source_url: item.file_url,
          description: item.description || "",
          tags: [businessName || "YZ Club"]
        };

        console.log("Sending media to Yodeck:", mediaPayload);

        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaPayload)
        });

        const rawResponse = await yodeckRes.text();
        let responseData;

        try {
          responseData = JSON.parse(rawResponse);
        } catch {
          return results.push({
            contentId: item.id,
            status: 'error',
            error: `Invalid JSON response: ${rawResponse}`
          });
        }

        if (!yodeckRes.ok) {
          results.push({
            contentId: item.id,
            status: 'error',
            error: responseData?.detail || responseData?.message || 'Unknown Yodeck error'
          });
        } else {
          results.push({
            contentId: item.id,
            status: 'success',
            yodeckId: responseData.id,
            name: responseData.name || mediaPayload.title
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
    console.error("Yodeck Sync Handler Error:", err.message);
    return res.status(500).json({ success: false, message: "Invalid JSON in request body" });
  }
};
