import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  try {
    const { businessId, businessName, content } = req.body;
    if (!content || !Array.isArray(content)) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure: missing content array' });
    }

    const results = [];

    for (const item of content) {
      try {
        const response = await fetch(item.file_url);
        if (!response.ok) throw new Error(`Failed to download media from: ${item.file_url}`);

        const buffer = await response.buffer();

        const form = new FormData();
        form.append('name', item.title || 'Untitled');
        form.append('description', item.description || '');
        form.append('duration', item.duration || 30);
        form.append('layout', 'FULL_SCREEN'); // Change if needed
        form.append('tags', `api-upload,business:${businessName}`);
        form.append('upload', buffer, {
          filename: item.file_url.split('/').pop(),
          contentType: response.headers.get('content-type') || 'application/octet-stream'
        });

        const yodeckRes = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ContentmanagerAPI:zVNM66cm5DEvytjlKoQeebWkVeybcoyrVoP-I_CHV47SQhPjVB3D-6EtAdByBEKM`,
            ...form.getHeaders()
          },
          body: form
        });

        const yodeckData = await yodeckRes.json();

        if (!yodeckRes.ok) {
          throw new Error(`Yodeck API error: ${JSON.stringify(yodeckData)}`);
        }

        results.push({
          contentId: item.id,
          yodeckMediaId: yodeckData.id,
          status: 'success'
        });
      } catch (error) {
        console.error('Error syncing content:', error.message);
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
        syncedCount: results.filter(r => r.status === 'success').length,
        syncedItems: results,
        errors: results.filter(r => r.status === 'error')
      }
    });
  } catch (error) {
    console.error('General error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
