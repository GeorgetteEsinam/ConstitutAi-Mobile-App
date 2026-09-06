// models/Article.js
const mongoose = require('mongoose');
 
const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);
 
// Enables $text search used by searchController
articleSchema.index({ title: 'text', content: 'text', category: 'text' });
 
const Article = mongoose.model('Article', articleSchema);
module.exports = Article;