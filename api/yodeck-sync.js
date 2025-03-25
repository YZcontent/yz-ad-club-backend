// api/yodeck-sync.js

import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    if (!businessId || !Array.isArray(content)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: Missing businessId or content array'
      });
    }

    const results = [];
    const label = process.env.YODECK_API_LABEL;
    const token = process.env.YODECK_API_TOKEN;

    if (!label || !token) {
      return res.status(500).json({
        success: false,
        message: 'Missing Yodeck API credentials in environment variables'
      });
    }

    for (const item of content) {
      try {
        const mediaPayload = {
          name: item.title || `Media ${item.id}`,
          description: item.description || '',
          type: mapContentType(item.content_type), // Map to Yodeck type
          source_url: item.file_url,
        };

        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${label}:${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaPayload)
        });

        const responseText = await yodeckRes.text();

        if (!yodeckRes.ok) {
          results.push({
            contentId: item.id,
            status: 'error',
            error: `Yodeck error (${yodeckRes.status}): ${responseText}`
          });
          continue;
        }

        const json = JSON.parse(responseText);

        results.push({
          contentId: item.id,
          status: 'success',
          yodeckMediaId: json.id || 'unknown'
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
      businessId,
      businessName,
      syncedCount: results.filter(r => r.status === 'success').length,
      syncedItems: results,
      errors: results.filter(r => r.status === 'error')
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Utility to map your internal content types to Yodeck types
function mapContentType(type) {
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'pdf':
    case 'document':
      return 'pdf';
    default:
      return 'image'; // fallback default
  }
}
