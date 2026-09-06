// controllers/searchController.js
// Keyword search, advanced filtered search, and autocomplete suggestions.
 
const Article = require('../models/Article');
 
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query (q) is required' });
 
        // Requires the text index defined in models/Article.js
        const results = await Article.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });
 
        res.status(200).json({ query: q, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.advancedSearch = async (req, res) => {
    try {
        const { category, author, dateFrom, dateTo } = req.query;
 
        const filter = {};
        if (category) filter.category = category;
        if (author) filter.author = author;
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }
 
        const results = await Article.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Search query (q) is required' });
 
        // Case-insensitive "starts with" match on the title, capped to keep it fast
        const matches = await Article.find(
            { title: { $regex: `^${q}`, $options: 'i' } },
            { title: 1 }
        ).limit(10);
 
        const suggestions = matches.map((a) => a.title);
        res.status(200).json({ query: q, suggestions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};