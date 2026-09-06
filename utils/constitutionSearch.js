const path = require('path');
const constitution = require(
    path.join(__dirname, '../ConstitutAImain/ConstitutAImainn/app/data/constitution.json')
);

const STOPWORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'its', 'may',
    'who', 'what', 'when', 'where', 'why', 'how', 'does', 'did', 'this', 'that',
    'with', 'from', 'about', 'into', 'than', 'then', 'them', 'they', 'their',
    'there', 'which', 'would', 'could', 'should', 'please', 'tell', 'explain',
    'mean', 'meaning', 'under', 'ghana', 'constitution', 'according',
    'article', 'articles', 'art',
]);

const ARTICLES = (constitution.chapters || []).flatMap((chapter) =>
    (chapter.articles || []).map((article) => ({
        id: String(article.id),
        number: article.number,
        title: article.title || '',
        text: article.text || '',
        chapterId: String(chapter.id),
        chapterNumber: chapter.number,
        chapterTitle: chapter.title || '',
        titleLower: (article.title || '').toLowerCase(),
        textLower: (article.text || '').toLowerCase(),
        chapterLower: (chapter.title || '').toLowerCase(),
    }))
);

function tokenize(question) {
    return String(question)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWord(haystack, token) {
    return new RegExp(`\\b${escapeRegex(token)}\\b`, 'i').test(haystack);
}

function containsToken(haystack, token) {
    if (containsWord(haystack, token)) return true;
    // education ~ educational, right ~ rights
    if (token.length >= 5) {
        return new RegExp(`\\b${escapeRegex(token.slice(0, 5))}`, 'i').test(haystack);
    }
    return false;
}

function mentionedArticleNumbers(question) {
    const numbers = new Set();
    const re = /\b(?:articles?|art\.?)\s*(\d+)\b/gi;
    let match;
    while ((match = re.exec(question))) {
        numbers.add(Number(match[1]));
    }
    return numbers;
}

function toSource(article) {
    return {
        id: article.id,
        number: article.number,
        title: article.title,
        chapterId: article.chapterId,
        chapterNumber: article.chapterNumber,
        chapterTitle: article.chapterTitle,
    };
}

/**
 * Rank constitution articles for a free-text question.
 * Returns the top matches (default 4) with score > 0.
 */
function findRelevantArticles(question, limit = 4) {
    const tokens = tokenize(question);
    const articleNums = mentionedArticleNumbers(question);
    const query = String(question).trim().toLowerCase();

    const scored = ARTICLES.map((article) => {
        let score = 0;
        let titleHits = 0;

        if (articleNums.has(Number(article.number))) {
            score += 80;
        }

        if (query.length >= 8 && article.titleLower.includes(query)) {
            score += 40;
        }

        for (const token of tokens) {
            if (containsToken(article.titleLower, token)) {
                score += 10;
                titleHits += 1;
            }
            if (containsToken(article.chapterLower, token)) score += 3;
            if (containsToken(article.textLower, token)) score += 2;
        }

        if (tokens.length >= 2 && titleHits === tokens.length) {
            score += 20;
        }

        return { article, score };
    })
        .filter((row) => row.score >= 8)
        .sort((a, b) => b.score - a.score || a.article.number - b.article.number)
        .slice(0, limit)
        .map((row) => row.article);

    return scored;
}

module.exports = {
    findRelevantArticles,
    toSource,
};
