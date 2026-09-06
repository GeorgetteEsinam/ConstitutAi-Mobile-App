const mongoose = require('mongoose');
 
const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Stored as a string so it works whether articleId is a Mongo ObjectId
    // (from an Article collection) or a static id from constitution.json.
    articleId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
 
// Prevent the same user from bookmarking the same article twice
bookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true });
 
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;