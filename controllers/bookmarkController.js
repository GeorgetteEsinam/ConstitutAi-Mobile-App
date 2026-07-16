// controllers/bookmarkController.js
// Manages a user's saved/bookmarked articles. All routes require auth.

exports.getUserBookmarks = async (req, res) => {
    try {
        // TODO: fetch bookmarks where userId === req.user.id from DB
        res.status(200).json({ message: 'getUserBookmarks ready – connect Bookmark model', bookmarks: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;
        // TODO: Bookmark.create({ userId: req.user.id, articleId })
        res.status(201).json({ message: `addBookmark ready – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;
        // TODO: Bookmark.findOneAndDelete({ userId: req.user.id, articleId })
        res.status(200).json({ message: `removeBookmark ready – articleId: ${articleId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
