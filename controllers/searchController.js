// controllers/searchController.js
// Keyword search, advanced filtered search, and autocomplete suggestions.

exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query (q) is required' });

        // TODO: Article.find({ $text: { $search: q } }) or similar
        res.status(200).json({ message: `search ready – query: "${q}"`, results: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.advancedSearch = async (req, res) => {
    try {
        const { category, author, dateFrom, dateTo } = req.query;
        // TODO: build a dynamic query object and pass to Article.find()
        res.status(200).json({ message: 'advancedSearch ready – connect Article model', results: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query (q) is required' });

        // TODO: return partial matches / autocomplete terms from DB
        res.status(200).json({ message: `getSuggestions ready – query: "${q}"`, suggestions: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
