// controllers/aiController.js
// AI-powered features: summarise, Q&A, recommendations, auto-tagging, file analysis.
//
// Uses the Anthropic API. Add your key to .env as:
//   ANTHROPIC_API_KEY=sk-ant-...
// (Node 18+ has global fetch built in, so no extra HTTP library is needed.)
 
const Article = require('../models/Article');
const History = require('../models/History');
const { findRelevantArticles, toSource } = require('../utils/constitutionSearch');
const pdfParse = require('pdf-parse');
 
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
 
async function callClaude(prompt) {
    if (!process.env.ANTHROPIC_API_KEY) {
        const err = new Error('ANTHROPIC_API_KEY is not set in .env');
        err.status = 500;
        throw err;
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
    };

    if (process.env.ANTHROPIC_WORKSPACE_ID) {
        headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;
    }
 
    const response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
        }),
    });
 
    if (!response.ok) {
        const errText = await response.text();
        const requiresWorkspace = response.status === 400 && errText.includes('anthropic-workspace-id');
        const message = requiresWorkspace
            ? 'This Anthropic API key requires a workspace. Add ANTHROPIC_WORKSPACE_ID to the backend .env file.'
            : `Anthropic API error: ${errText}`;
        const err = new Error(message);
        err.status = requiresWorkspace ? 500 : 502;
        throw err;
    }
 
    const data = await response.json();
    return data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
}
 
exports.summarizeArticle = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const { title, content } = req.body || {};

        const article = await resolveArticleContext({ articleId, title, content });
        if (!article) {
            return res.status(400).json({
                error: 'Article text is required. Send title and content, or a valid article id.',
            });
        }

        const summary = await callClaude(
            [
                'You are Constitut AI, an assistant that helps people understand the Constitution of Ghana (1992).',
                'Summarise the following article in 3-4 concise sentences in plain language.',
                'Do not add information that is not in the article. Do not give legal advice.',
                '',
                `Title: ${article.title}`,
                '',
                article.content,
            ].join('\n')
        );

        res.status(200).json({ articleId: article.articleId, summary });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
 
function isMongoObjectId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

async function resolveArticleContext({ articleId, title, content }) {
    if (typeof content === 'string' && content.trim()) {
        return {
            articleId: articleId || null,
            title: (title && String(title).trim()) || 'Article',
            content: content.trim(),
        };
    }

    if (isMongoObjectId(articleId)) {
        const article = await Article.findById(articleId);
        if (article) {
            return {
                articleId,
                title: article.title,
                content: article.content,
            };
        }
    }

    return null;
}

function buildAskPrompt({ question, article, retrieved }) {
    if (article) {
        return [
            'You are Constitut AI, an assistant that helps people understand the Constitution of Ghana (1992).',
            'Answer the question using only the article text below. If the answer is not in the article, say so clearly.',
            'Do not give legal advice. Be concise and cite clauses when they appear in the text.',
            '',
            `Article title: ${article.title}`,
            '',
            article.content,
            '',
            `Question: ${question}`,
        ].join('\n');
    }

    if (retrieved && retrieved.length > 0) {
        const excerpts = retrieved
            .map(
                (item) =>
                    `--- Article ${item.number}: ${item.title} (Chapter ${item.chapterNumber}: ${item.chapterTitle})\n${item.text}`
            )
            .join('\n\n');

        return [
            'You are Constitut AI, an assistant that helps people understand the Constitution of Ghana (1992).',
            'Answer the question using only the constitution excerpts below.',
            'Cite article numbers. If the excerpts do not contain the answer, say so clearly and do not invent provisions.',
            'Do not give legal advice. Be concise.',
            '',
            excerpts,
            '',
            `Question: ${question}`,
        ].join('\n');
    }

    return [
        'You are Constitut AI, an assistant that helps people understand the Constitution of Ghana (1992).',
        'No matching constitution article was found for this question in the indexed text.',
        'Tell the user you could not find a matching article, and ask them to rephrase or open a specific article.',
        'Do not invent constitutional provisions. Do not give legal advice.',
        '',
        `Question: ${question}`,
    ].join('\n');
}

// POST /api/ai/ask and POST /api/ai/ask/:articleId
// Accepts { question, title?, content? }. If title/content are sent from the
// app (constitution.json), those are used. Otherwise a Mongo article is loaded.
// If neither is available, relevant constitution articles are retrieved by keyword.
exports.ask = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const { question, title, content } = req.body;

        if (!question || !String(question).trim()) {
            return res.status(400).json({ error: 'A question is required' });
        }

        const trimmedQuestion = String(question).trim();
        const article = await resolveArticleContext({ articleId, title, content });
        const retrieved = article ? [] : findRelevantArticles(trimmedQuestion);
        const answer = await callClaude(
            buildAskPrompt({ question: trimmedQuestion, article, retrieved })
        );

        res.status(200).json({
            articleId: article ? article.articleId : null,
            question: trimmedQuestion,
            answer,
            grounded: Boolean(article) || retrieved.length > 0,
            sources: article
                ? []
                : retrieved.map(toSource),
        });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

exports.askAboutArticle = exports.ask;
 
exports.getRecommendations = async (req, res) => {
    try {
        // Base recommendations on the user's most recently viewed articles
        const recent = await History.find({ userId: req.user.id })
            .sort({ viewedAt: -1 })
            .limit(5);
 
        if (recent.length === 0) {
            return res.status(200).json({ message: 'No reading history yet', recommendations: [] });
        }
 
        const recentIds = recent.map((h) => h.articleId);
        // Simple content-based fallback: most recent articles the user hasn't already read,
        // in the same category as their last-read article.
        const lastArticle = await Article.findById(recentIds[0]).catch(() => null);
 
        const filter = { _id: { $nin: recentIds } };
        if (lastArticle) filter.category = lastArticle.category;
 
        const recommendations = await Article.find(filter).sort({ createdAt: -1 }).limit(5);
        res.status(200).json({ recommendations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 
function parseTags(raw) {
    const cleaned = String(raw || '').replace(/```json|```/g, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        parsed = cleaned
            .split(/[,\n]/)
            .map((item) => item.replace(/^[-*•\d.\s"]+|["']$/g, '').trim())
            .filter(Boolean);
    }

    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    return parsed
        .map((tag) => String(tag).trim())
        .filter((tag) => {
            if (!tag || tag.length > 40) return false;
            const key = tag.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 6);
}

// ── File Analysis ─────────────────────────────────────────────
// Extracts text from an uploaded file (PDF or plain text) and asks
// Claude to compare/analyse it against the Ghana Constitution (1992).

async function extractTextFromFile(file) {
  const mime = (file.mimetype || '').toLowerCase();
  const originalName = (file.originalname || '').toLowerCase();
  const buffer = file.buffer;

  if (mime === 'application/pdf' || originalName.endsWith('.pdf')) {
    try {
      if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === 'function') {
          await parser.destroy().catch(() => {});
        }
        return (result && result.text ? result.text : '').trim();
      } else if (typeof pdfParse === 'function') {
        const result = await pdfParse(buffer);
        return (result && result.text ? result.text : '').trim();
      }
    } catch (pdfErr) {
      console.error('PDF parsing error:', pdfErr);
      throw new Error('Could not read PDF content. Please ensure the file is an uncorrupted PDF document.');
    }
  }

  // Plain text / Markdown / Text files
  try {
    const text = buffer.toString('utf-8').trim();
    return text;
  } catch (err) {
    throw new Error('Could not read text file encoding.');
  }
}

exports.analyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const { question } = req.body;
    const fileText = await extractTextFromFile(req.file);

    if (!fileText || fileText.length < 10) {
      return res.status(400).json({
        error: 'Could not extract readable text from the uploaded file. Please upload a standard text or PDF document.',
      });
    }

    // Truncate to ~14 000 chars to stay within token limits
    const truncated = fileText.length > 14000
      ? fileText.slice(0, 14000) + '\n\n[... document truncated for constitutional analysis ...]'
      : fileText;

    const userQuestion = question && String(question).trim()
      ? String(question).trim()
      : 'Analyze this case or legal document and compare it with the Constitution of the Republic of Ghana (1992). Cite specific articles where relevant.';

    const prompt = [
      'You are Constitut AI, a specialised legal assistant for the Constitution of the Republic of Ghana (1992).',
      'A user has uploaded a case file or legal document. Provide a comprehensive, well-structured constitutional assessment with the following clearly labeled sections:',
      '',
      '1. 📋 BRIEF SUMMARY OF DOCUMENT: Key legal facts, parties, claims, or subject matter.',
      '2. 🏛️ RELEVANT CONSTITUTIONAL PROVISIONS: Specific articles of the Ghana Constitution 1992 that apply (e.g. Chapter 5 Fundamental Human Rights, Police, Judiciary, Legislature, etc.). Always cite specific Article numbers.',
      '3. ⚖️ CONSTITUTIONAL COMPARISON & ANALYSIS: How the case aligns with, departs from, or conflicts with the 1992 Constitution.',
      '4. 🛡️ RIGHTS & PROTECTIONS / POTENTIAL VIOLATIONS: Highlight any constitutional guarantees at stake or potential violations.',
      '5. 📌 KEY TAKEAWAYS: Objective conclusion and legal takeaways (educational and informational; not formal legal counsel).',
      '',
      '── UPLOADED DOCUMENT CONTENT ──',
      truncated,
      '── END OF DOCUMENT ──',
      '',
      `User Question / Focus: ${userQuestion}`,
    ].join('\n');

    const analysis = await callClaude(prompt);

    // Pull relevant constitution articles based on the file content and query
    const keywords = userQuestion + ' ' + fileText.slice(0, 600);
    const sources = findRelevantArticles(keywords).map(toSource);

    res.status(200).json({
      filename: req.file.originalname,
      analysis,
      sources,
    });
  } catch (err) {
    console.error('File analysis error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Error analyzing file.' });
  }
};

exports.autoTagArticle = async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const { title, content } = req.body || {};

        const article = await resolveArticleContext({ articleId, title, content });
        if (!article) {
            return res.status(400).json({
                error: 'Article text is required. Send title and content, or a valid article id.',
            });
        }

        const raw = await callClaude(
            [
                'You are Constitut AI, tagging articles from the Constitution of Ghana (1992).',
                'Suggest 3-6 short topic tags for this article (1-3 words each).',
                'Respond with ONLY a JSON array of strings, nothing else.',
                '',
                `Title: ${article.title}`,
                '',
                article.content,
            ].join('\n')
        );

        const tags = parseTags(raw);
        res.status(200).json({ articleId: article.articleId, tags });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};