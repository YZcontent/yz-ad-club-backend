export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { YODECK_API_LABEL, YODECK_API_TOKEN } = process.env;
  const authHeader = `Token ${YODECK_API_LABEL}:${YODECK_API_TOKEN}`;

  try {
    const { content } = req.body;

    const results = await Promise.all(
      content.map(async (item) => {
        const response = await fetch('https://api.yodeck.com/media/', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: item.title,
            url: item.file_url,
            type: item.content_type || 'video',
            duration: item.duration || 30
          })
        });

        const data = await response.json();

        return {
          contentId: item.id,
          yodeckId: data.id,
          status: response.ok ? 'success' : 'error',
          error: response.ok ? null : data
        };
      })
    );

    res.status(200).json({ success: true, syncedItems: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
