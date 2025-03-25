const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let parsed;
  try {
    parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  const { businessId, businessName, content } = parsed;

  if (!Array.isArray(content)) {
    return res.status(400).json({ success: false, message: "Content must be an array" });
  }

  const label = process.env.YODECK_API_LABEL;
  const token = process.env.YODECK_API_TOKEN;

  if (!label || !token) {
    return res.status(500).json({ success: false, message: "Missing Yodeck credentials" });
  }

  const authHeader = `Token ${label}:${token}`;
  const results = [];

  for (const item of content) {
    try {
      const supportedTypes = ['image', 'video', 'web_page'];
      const mediaType = item.content_type || 'image';

      if (!supportedTypes.includes(mediaType)) {
        results.push({
          contentId: item.id,
          status: 'error',
          error: `Unsupported content_type: ${mediaType}`
        });
        continue;
      }

      const mediaTitle = item.title || 'Untitled';
      const description = item.description || '';
      const fileUrl = item.file_url;

      // Download file
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        results.push({
          contentId: item.id,
          status: 'error',
          error: `Failed to download file: ${fileResponse.statusText}`
        });
        continue;
      }

      const buffer = await fileResponse.buffer();
      const contentDisposition = fileResponse.headers.get('content-disposition');
      const fileName =
        contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || `${Date.now()}-upload`;

      // Prepare FormData payload
      const form = new FormData();
      form.append('title', mediaTitle);
      form.append('description', description);
      form.append('media_type', mediaType);
      form.append('tags', businessName || 'YZ Club');
      form.append('upload', buffer, fileName);

      const yodeckRes = await fetch('https://api.yodeck.com/media/', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          ...form.getHeaders()
        },
        body: form
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
};
