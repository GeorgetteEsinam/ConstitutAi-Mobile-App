// controllers/bookmarkController.js
// Manages a user's saved/bookmarked articles. All routes require auth.
 
const Bookmark = require('../models/Bookmark');
 
exports.getUserBookmarks = async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ bookmarks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.addBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;
 
        // Avoid duplicate-key errors and give a clear response if it's already saved
        const existing = await Bookmark.findOne({ userId: req.user.id, articleId });
        if (existing) {
            return res.status(200).json({ message: 'Already bookmarked', bookmark: existing });
        }
 
        const bookmark = await Bookmark.create({ userId: req.user.id, articleId });
        res.status(201).json({ message: 'Bookmark added', bookmark });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.removeBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;
        const deleted = await Bookmark.findOneAndDelete({ userId: req.user.id, articleId });
 
        if (!deleted) {
            return res.status(404).json({ error: 'Bookmark not found' });
        }
 
        res.status(200).json({ message: 'Bookmark removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};