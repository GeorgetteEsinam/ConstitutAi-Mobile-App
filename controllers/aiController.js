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
const mammoth = require('mammoth');
 
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function callClaude(promptOrContent, options = {}) {
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

    const content = typeof promptOrContent === 'string'
        ? promptOrContent
        : promptOrContent;

    const maxTokens = options.max_tokens || (Array.isArray(content) ? 2500 : 1200);

    const response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: MODEL,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content }],
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

function cleanExtractedText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '') // Remove pdf-parse page counters
    .replace(/^\s*\d+\s*$/gm, '') // Remove standalone page numbers
    .trim();
}

async function extractTextFromFile(file, buffer) {
  const mime = (file.mimetype || '').toLowerCase();
  const originalName = (file.originalname || '').toLowerCase();
  const buf = buffer || file.buffer;

  if (!buf || buf.length === 0) {
    return '';
  }

  // 1. DOCX / DOC (Word Document via mammoth)
  if (
    originalName.endsWith('.docx') ||
    originalName.endsWith('.doc') ||
    mime.includes('wordprocessingml') ||
    mime.includes('msword') ||
    (buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04)
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: buf });
      const docxText = cleanExtractedText(result?.value || '');
      if (docxText.length > 0) {
        return docxText;
      }
    } catch (docxErr) {
      console.warn('DOCX extraction attempt failed:', docxErr.message);
    }
  }

  // 2. PDF Document text extraction
  if (
    mime === 'application/pdf' ||
    originalName.endsWith('.pdf') ||
    (buf.length > 4 && buf.slice(0, 4).toString() === '%PDF')
  ) {
    try {
      if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buf });
        const result = await parser.getText();
        if (typeof parser.destroy === 'function') {
          await parser.destroy().catch(() => {});
        }
        const text = cleanExtractedText(result && result.text ? result.text : '');
        return text;
      } else if (typeof pdfParse === 'function') {
        const result = await pdfParse(buf);
        const text = cleanExtractedText(result && result.text ? result.text : '');
        return text;
      }
    } catch (pdfErr) {
      console.warn('PDF digital text extraction attempt failed:', pdfErr.message);
      return '';
    }
  }

  // 3. Plain text / Markdown / Text files
  try {
    const text = buf.toString('utf-8').trim();
    if (!text.includes('\u0000')) {
      return text;
    }
  } catch (err) {
    console.warn('UTF-8 text decode failed:', err.message);
  }

  return '';
}

exports.analyzeFile = async (req, res) => {
  try {
    let buffer = null;
    let originalName = 'case_document';
    let mime = '';

    // 1. Resolve buffer and metadata from req.file or req.body.fileBase64
    if (req.file && req.file.buffer && req.file.buffer.length > 0) {
      buffer = req.file.buffer;
      originalName = req.file.originalname || 'case_document';
      mime = (req.file.mimetype || '').toLowerCase();
    } else if (req.body && req.body.fileBase64) {
      let b64 = String(req.body.fileBase64).trim();
      if (b64.startsWith('data:')) {
        const commaIdx = b64.indexOf(',');
        if (commaIdx !== -1) {
          const meta = b64.slice(0, commaIdx);
          const match = meta.match(/:(.*?);/);
          if (match) mime = match[1].toLowerCase();
          b64 = b64.slice(commaIdx + 1);
        }
      }
      buffer = Buffer.from(b64, 'base64');
      if (req.body.fileName) originalName = req.body.fileName;
      if (req.body.fileMime) mime = req.body.fileMime.toLowerCase();
    }

    const { question, fileText: directText } = req.body || {};
    const userQuestion = question && String(question).trim()
      ? String(question).trim()
      : 'Analyze this case study or legal document and compare it thoroughly with the Constitution of the Republic of Ghana (1992). Cite specific articles where relevant.';

    // Check if directText is provided (e.g. from client-side text read)
    let fileText = directText && String(directText).trim().length > 20 ? String(directText).trim() : '';

    // If buffer exists, detect format
    const lowerName = originalName.toLowerCase();
    const isPdf = Boolean(
      mime === 'application/pdf' ||
      lowerName.endsWith('.pdf') ||
      (buffer && buffer.length > 4 && buffer.slice(0, 4).toString() === '%PDF')
    );
    const isImage = Boolean(
      mime.startsWith('image/') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp') ||
      (buffer && buffer.length > 4 && (
        (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ||
        (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF)
      ))
    );

    // Try text extraction if not already provided
    if (!fileText && buffer && !isImage) {
      fileText = await extractTextFromFile({ originalname: originalName, mimetype: mime }, buffer);
    }

    let analysis = '';
    let usedKeywords = userQuestion;

    // SCENARIO 1: PDF Document where text extraction was minimal or empty (e.g. Scanned Case Study)
    // Send directly to Claude using native multimodal document support!
    if (isPdf && (!fileText || fileText.length < 50) && buffer && buffer.length > 0) {
      console.log(`[analyzeFile] Using Claude native PDF document processing for "${originalName}" (${buffer.length} bytes)...`);

      const base64Pdf = buffer.toString('base64');
      const messagesContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Pdf,
          },
        },
        {
          type: 'text',
          text: [
            'You are Constitut AI, a specialised legal assistant for the Constitution of the Republic of Ghana (1992).',
            'Carefully read, transcribe (via visual OCR if this is a scanned court document or case study), and analyze the attached PDF.',
            'Compare the document thoroughly with the Constitution of the Republic of Ghana (1992).',
            '',
            'Your response MUST be comprehensive, well-structured, and clearly labeled with these 5 sections:',
            '1. 📋 SUMMARY: A concise factual overview of the case/document, parties involved, background facts, and key legal claims.',
            '2. 🏛️ RELEVANT CONSTITUTIONAL PROVISIONS: Specific articles of the 1992 Constitution of Ghana that are engaged (e.g. Chapter 5 Fundamental Human Rights like Article 12, 14, 19, 21, etc., or Articles relating to Executive/Judiciary/Legislature). Always cite specific article numbers.',
            '3. ⚖️ CONSTITUTIONAL COMPARISON & ANALYSIS: How the case aligns with, departs from, or conflicts with the 1992 Ghana Constitution.',
            '4. 🛡️ RIGHTS & PROTECTIONS / VIOLATIONS: Highlight any constitutional violations, protections, or guarantees at issue.',
            '5. 📌 KEY TAKEAWAYS: Objective conclusion and legal takeaways (educational and informative).',
            '',
            `User Question / Focus: ${userQuestion}`,
          ].join('\n'),
        },
      ];

      analysis = await callClaude(messagesContent, { max_tokens: 2500 });
      usedKeywords = `${userQuestion} ${originalName}`;
    }

    // SCENARIO 2: Image of a case study / court document
    else if (isImage && buffer && buffer.length > 0) {
      console.log(`[analyzeFile] Using Claude native image processing for "${originalName}"...`);
      const imageMime = mime && mime.startsWith('image/') ? mime : (lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const base64Img = buffer.toString('base64');
      const messagesContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageMime,
            data: base64Img,
          },
        },
        {
          type: 'text',
          text: [
            'You are Constitut AI, a specialised legal assistant for the Constitution of the Republic of Ghana (1992).',
            'Carefully read the text in this image (a legal document or case study) and analyze it against the Constitution of Ghana (1992).',
            '',
            'Your response MUST include:',
            '1. 📋 SUMMARY: Factual overview of the case study or document.',
            '2. 🏛️ RELEVANT CONSTITUTIONAL PROVISIONS: Specific articles of the 1992 Constitution of Ghana that apply. Cite article numbers.',
            '3. ⚖️ CONSTITUTIONAL COMPARISON & ANALYSIS: Detailed comparison with constitutional principles.',
            '4. 🛡️ RIGHTS & PROTECTIONS / VIOLATIONS: Highlight any constitutional violations or protections at issue.',
            '5. 📌 KEY TAKEAWAYS: Objective conclusion and legal takeaways.',
            '',
            `User Question / Focus: ${userQuestion}`,
          ].join('\n'),
        },
      ];

      analysis = await callClaude(messagesContent, { max_tokens: 2500 });
      usedKeywords = `${userQuestion} ${originalName}`;
    }

    // SCENARIO 3: Digital text extracted from PDF, DOCX, TXT, or sent directly
    else if (fileText && fileText.length >= 20) {
      console.log(`[analyzeFile] Using extracted text (${fileText.length} chars) for "${originalName}"...`);
      // Truncate to ~18 000 chars to stay safely within token limits
      const truncated = fileText.length > 18000
        ? fileText.slice(0, 18000) + '\n\n[... document truncated for constitutional analysis ...]'
        : fileText;

      const prompt = [
        'You are Constitut AI, a specialised legal assistant for the Constitution of the Republic of Ghana (1992).',
        'The user has provided the following legal case file or case study document.',
        'Carefully read and analyze this document, then compare it with the Constitution of the Republic of Ghana (1992).',
        '',
        'Your response MUST include:',
        '1. 📋 SUMMARY: A concise factual overview of the case/document, parties involved, and key claims.',
        '2. 🏛️ RELEVANT CONSTITUTIONAL PROVISIONS: Specific articles of the 1992 Constitution of Ghana that are engaged (e.g. Chapter 5 Fundamental Human Rights like Article 12, 14, 19, 21, etc.). Always cite article numbers.',
        '3. ⚖️ CONSTITUTIONAL COMPARISON & ANALYSIS: How the case aligns with, departs from, or conflicts with the 1992 Ghana Constitution.',
        '4. 🛡️ RIGHTS & PROTECTIONS / VIOLATIONS: Highlight any constitutional violations or protections at issue.',
        '5. 📌 KEY TAKEAWAYS: Objective conclusion and legal takeaways (educational and informative).',
        '',
        '── DOCUMENT / CASE STUDY CONTENT ──',
        truncated,
        '── END OF DOCUMENT CONTENT ──',
        '',
        `User Question / Focus: ${userQuestion}`,
      ].join('\n');

      analysis = await callClaude(prompt, { max_tokens: 2500 });
      usedKeywords = `${userQuestion} ${fileText.slice(0, 600)}`;
    } else {
      return res.status(400).json({
        error: 'No readable content could be found in the uploaded file. Please ensure the file is not empty or corrupted.',
      });
    }

    // Retrieve relevant constitution articles
    const sources = findRelevantArticles(usedKeywords).map(toSource);

    res.status(200).json({
      filename: originalName,
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