const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // set this in your .env — never hardcode it
});

const SYSTEM_PROMPT = `You are a knowledgeable, neutral assistant that answers questions about the 1992 Constitution of the Republic of Ghana.
 
Rules:
- Only answer questions about Ghana's Constitution, its articles, chapters, amendments, and directly related civic/legal topics (e.g. how a bill becomes law, structure of government, fundamental human rights, the judiciary, chieftaincy, elections).
- If a question is unrelated to Ghana's Constitution, politely say so and redirect the user back to constitutional topics.
- When possible, mention the relevant Article or Chapter number.
- Be clear and easy to understand for a general audience, not just lawyers.
- If you are not certain of an exact article number, say so rather than guessing confidently.
- Keep answers concise unless the user asks for detail.`;

exports.askConstitution = async (req, res) => {
    try {
        const { question, history = [] } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'Missing question' });
        }

        const recentHistory = history.slice(-8).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        }));

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...recentHistory,
            ],
            temperature: 0.3,
            max_tokens: 600,
        });

        const answer = completion.choices[0]?.message?.content?.trim() || 'No answer generated.';
        res.json({ answer });
    } catch (err) {
        console.error('OpenAI error:', err);
        res.status(500).json({ error: 'Something went wrong generating the answer.' });
    }
};
