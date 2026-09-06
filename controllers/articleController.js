// controllers/articleController.js
// CRUD operations for articles.
 
const Article = require('../models/Article');
 
exports.getAllArticles = async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.status(200).json({ articles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });
        res.status(200).json({ article });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.createArticle = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content)
            return res.status(400).json({ error: 'Title and content are required' });
 
        const article = await Article.create({ title, content, category, author: req.user.id });
        res.status(201).json({ message: 'Article created', article });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.updateArticle = async (req, res) => {
    try {
        // Whitelist only the fields that are safe to update
        const { title, content, category } = req.body;
 
        if (!title && !content && !category)
            return res.status(400).json({ error: 'Nothing to update – provide title, content, or category' });
 
        const updates = {};
        if (title) updates.title = title;
        if (content) updates.content = content;
        if (category) updates.category = category;
 
        const article = await Article.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });
        if (!article) return res.status(404).json({ error: 'Article not found' });
 
        res.status(200).json({ message: 'Article updated', article });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });
 
        res.status(200).json({ message: 'Article deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};