// controllers/historyController.js
// Tracks which articles the logged-in user has viewed and when.

exports.getUserHistory = async (req, res) => {
    try {
        // TODO: fetch history records sorted by viewedAt desc where userId === req.user.id
        res.status(200).json({ message: 'getUserHistory ready – connect History model', history: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logArticleView = async (req, res) => {
    try {
        const { articleId } = req.params;
        // TODO: upsert a History record { userId: req.user.id, articleId, viewedAt: Date.now() }
        res.status(201).json({ message: `logArticleView ready – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearHistory = async (req, res) => {
    try {
        // TODO: History.deleteMany({ userId: req.user.id })
        res.status(200).json({ message: 'clearHistory ready – connect History model' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeHistoryEntry = async (req, res) => {
    try {
        const { articleId } = req.params;
        // TODO: History.findOneAndDelete({ userId: req.user.id, articleId })
        res.status(200).json({ message: `removeHistoryEntry ready – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
