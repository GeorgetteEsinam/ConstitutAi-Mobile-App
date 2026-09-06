// controllers/historyController.js
// Tracks which articles the logged-in user has viewed and when.
 
const History = require('../models/History');
 
exports.getUserHistory = async (req, res) => {
    try {
        const history = await History.find({ userId: req.user.id }).sort({ viewedAt: -1 });
        res.status(200).json({ history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.logArticleView = async (req, res) => {
    try {
        const { articleId } = req.params;
 
        // Upsert: create the entry, or bump viewedAt if it already exists
        const entry = await History.findOneAndUpdate(
            { userId: req.user.id, articleId },
            { viewedAt: Date.now() },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
 
        res.status(201).json({ message: `View logged – articleId: ${articleId}`, entry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.clearHistory = async (req, res) => {
    try {
        await History.deleteMany({ userId: req.user.id });
        res.status(200).json({ message: 'History cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.removeHistoryEntry = async (req, res) => {
    try {
        const { articleId } = req.params;
        const deleted = await History.findOneAndDelete({ userId: req.user.id, articleId });
 
        if (!deleted) {
            return res.status(404).json({ error: 'History entry not found' });
        }
 
        res.status(200).json({ message: `History entry removed – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};