import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  try {
    const { businessId, content = [] } = req.body;

    if (!businessId || content.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing businessId or content array'
      });
    }

    const results = await Promise.all(content.map(async (item) => {
      try {
        const response = await fetch('https://api.yodeck.com/rest/v2/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ContentmanagerAPI:${process.env.YODECK_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: item.title || `Content ${item.id}`,
            type: item.content_type || 'video',
            filename: item.file_url,
            layout: 'fullscreen'
          })
        });

        const data = await response.json();

        return {
          contentId: item.id,
          yodeckId: data.id || null,
          status: response.ok ? 'success' : 'error',
          error: !response.ok ? data : null
        };
      } catch (error) {
        return {
          contentId: item.id,
          status: 'error',
          error: error.message
        };
      }
    }));

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Yodeck sync error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
