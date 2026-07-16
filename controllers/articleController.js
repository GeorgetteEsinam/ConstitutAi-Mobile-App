// controllers/articleController.js
// CRUD operations for articles.

exports.getAllArticles = async (req, res) => {
    try {
        // TODO: const articles = await Article.find().sort({ createdAt: -1 });
        res.status(200).json({ message: 'getAllArticles ready – connect your Article model', articles: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getArticleById = async (req, res) => {
    try {
        // TODO: const article = await Article.findById(req.params.id);
        res.status(200).json({ message: `getArticleById ready – id: ${req.params.id}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createArticle = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content)
            return res.status(400).json({ error: 'Title and content are required' });

        // TODO: const article = await Article.create({ ...req.body, author: req.user.id });
        res.status(201).json({ message: 'createArticle ready – connect your Article model' });
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

        // TODO: const article = await Article.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        // TODO: if (!article) return res.status(404).json({ error: 'Article not found' });
        res.status(200).json({ message: `updateArticle ready – id: ${req.params.id}`, updates });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteArticle = async (req, res) => {
    try {
        // TODO: await Article.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `deleteArticle ready – id: ${req.params.id}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
