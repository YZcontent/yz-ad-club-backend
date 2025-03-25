// /api/yodeck-sync.js

import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { businessId, businessName, content } = req.body;

    if (!content || !Array.isArray(content)) {
      return res.status(400).json({ success: false, message: 'Invalid content format' });
    }

    const label = process.env.YODECK_API_LABEL;
    const token = process.env.YODECK_API_TOKEN;

    const yodeckResults = [];

    for (const item of content) {
      try {
        const mediaData = new FormData();
        mediaData.append('name', item.title || `Content-${Date.now()}`);
        mediaData.append('media_type', item.content_type || 'image');
        mediaData.append('description', item.description || '');
        mediaData.append('tags', JSON.stringify(['base44', 'upload', businessName]));
        mediaData.append('play_until_complete', 'true');

        // Include duration only for image, video, or slideshow types
        if (item.duration && ['image', 'video', 'slideshow'].includes(item.content_type)) {
          mediaData.append('duration', item.duration);
        }

        // File via URL (Yodeck will fetch from this)
        mediaData.append('source_url', item.file_url);

        const response = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            Authorization: `Token ${label}:${token}`
          },
          body: mediaData
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || 'Failed to upload media to Yodeck');
        }

        yodeckResults.push({
          contentId: item.id,
          yodeckId: result.id,
          name: result.name,
          status: 'success'
        });
      } catch (err) {
        yodeckResults.push({
          contentId: item.id,
          status: 'error',
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      businessId,
      syncedItems: yodeckResults
    });

  } catch (error) {
    console.error('Yodeck sync error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
