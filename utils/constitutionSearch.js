const path = require('path');
const rawConstitution = require(
    path.join(__dirname, '../ConstitutAImain/ConstitutAImainn/app/data/constitution.json')
);

const chapterDefinitions = [
    ['The Constitution', 1, 3], ['Territories of Ghana', 4, 5], ['Citizenship', 6, 10],
    ['The Laws of Ghana', 11, 11], ['Fundamental Human Rights and Freedoms', 12, 33],
    ['The Directive Principles of State Policy', 34, 41], ['Representation of the People', 42, 56],
    ['The Executive', 57, 88], ['The Council of State', 89, 92], ['The Legislature', 93, 124],
    ['The Judiciary', 125, 161], ['Freedom and Independence of the Media', 162, 173],
    ['Finance', 174, 189], ['The Public Services', 190, 199], ['The Police Service', 200, 204],
    ['The Prisons Service', 205, 209], ['The Armed Forces of Ghana', 210, 215],
    ['Commission on Human Rights and Administrative Justice', 216, 230],
    ['National Commission for Civic Education', 231, 239], ['Decentralization and Local Government', 240, 256],
    ['Lands and Natural Resources', 257, 269], ['Chieftaincy', 270, 277], ['Commissions of Inquiry', 278, 283],
    ['Code of Conduct for Public Officers', 284, 288], ['Amendment of the Constitution', 289, 292],
    ['Miscellaneous', 293, 299],
];

const article34 = {
    id: '34', number: 34, title: 'Implementation of Directive Principles',
    text: '(1) The Directive Principles of State Policy contained in this Chapter shall guide all citizens, Parliament, the President, the Judiciary, the Council of State, the Cabinet, political parties and other bodies and persons in applying or interpreting this Constitution or any other law and in taking and implementing any policy decisions, for the establishment of a just and free society.\n\n(2) The President shall report to Parliament at least once a year all the steps taken to ensure the realization of the policy objectives contained in this Chapter; and, in particular, the realization of basic human rights, a healthy economy, the right to work, the right to good health care and the right to education.',
};

const rawArticles = rawConstitution.chapters.flatMap((chapter) => chapter.articles);
const articlesByNumber = new Map(rawArticles.map((article) => [article.number, article]));
articlesByNumber.set(34, article34);
const constitution = {
    chapters: chapterDefinitions.map(([title, firstArticle, lastArticle], index) => ({
        id: String(index + 1), number: index + 1, title,
        articles: Array.from({ length: lastArticle - firstArticle + 1 }, (_, offset) =>
            articlesByNumber.get(firstArticle + offset)
        ).filter(Boolean),
    })),
};

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
