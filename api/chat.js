export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing OPENAI_API_KEY env var' });
    }

    try {
        const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant for AI Clearinghouse.' },
                    { role: 'user', content: message },
                ],
                temperature: 0.7,
            }),
        });

        if (!completionResponse.ok) {
            const errorText = await completionResponse.text();
            throw new Error(`OpenAI API error: ${errorText}`);
        }

        const completionData = await completionResponse.json();
        const reply = completionData.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            throw new Error('No reply returned from OpenAI API');
        }

        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: 'Failed to generate response' });
    }
}
