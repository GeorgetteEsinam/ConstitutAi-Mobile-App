// controllers/aiController.js
// AI-powered features: summarise, Q&A, recommendations, auto-tagging.
// Wire these up to your chosen AI provider (e.g. Claude, OpenAI).

exports.summarizeArticle = async (req, res) => {
    try {
        const { articleId } = req.params;
        // TODO: fetch article content, send to AI API, return summary
        res.status(200).json({ message: `summarizeArticle ready – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.askAboutArticle = async (req, res) => {
    try {
        const { articleId } = req.params;
        const { question } = req.body;
        if (!question)
            return res.status(400).json({ error: 'A question is required' });

        // TODO: fetch article, send question + content to AI, return answer
        res.status(200).json({ message: `askAboutArticle ready – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        // TODO: use req.user.id to pull reading history and return personalised recommendations
        res.status(200).json({ message: 'getRecommendations ready – connect reading history', recommendations: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.autoTagArticle = async (req, res) => {
    try {
        const { articleId } = req.params;
        // TODO: fetch article, send to AI, get suggested tags, optionally save them
        res.status(200).json({ message: `autoTagArticle ready – articleId: ${articleId}`, tags: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
