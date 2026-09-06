// models/History.js
const mongoose = require('mongoose');
 
const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // String so it works whether articleId is a Mongo ObjectId (Article
    // collection) or a static id from the app's bundled article data.
    articleId: {
      type: String,
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
 
// One history entry per user/article — re-viewing just bumps viewedAt
historySchema.index({ userId: 1, articleId: 1 }, { unique: true });
 
const History = mongoose.model('History', historySchema);
module.exports = History;