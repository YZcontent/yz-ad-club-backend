export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { businessId, businessName, content } = req.body;

      console.log('Yodeck Sync Triggered:', { businessId, contentCount: content?.length });

      // Simulate response
      const results = content.map(item => ({
        contentId: item.id,
        yodeckId: 'test-123',
        status: 'success'
      }));

      res.status(200).json({
        success: true,
        details: results
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
