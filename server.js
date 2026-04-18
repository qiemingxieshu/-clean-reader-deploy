const express = require('express');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const cors = require('cors');

const app = express();

// 中间件：允许所有来源访问（CORS）
app.use(cors({ origin: '*' }));
app.use(express.json());

// 提取内容 API
app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 使用原生 fetch (Node 18+)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url: url });
    const document = dom.window.document;

    // 使用 Readability 提取正文
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract article content');
    }

    // 提取上一页/下一页链接
    const prevUrl = extractNavLink(document, ['prev', 'previous', '上一页', '上页', 'backward']) || 
                    extractPaginationLink(document, -1, url);
    const nextUrl = extractNavLink(document, ['next', 'next page', '下一页', '下页', 'forward']) || 
                    extractPaginationLink(document, 1, url);

    res.json({
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      direction: article.dir || 'ltr',
      prevUrl: prevUrl,
      nextUrl: nextUrl
    });
  } catch (error) {
    console.error('Error extracting content:', error);
    res.status(500).json({ 
      error: 'Failed to extract content', 
      message: error.message 
    });
  }
});

// 提取导航链接
function extractNavLink(document, keywords) {
  const links = document.querySelectorAll('a');
  for (const link of links) {
    const text = link.textContent.trim().toLowerCase();
    const href = link.href;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        if (isValidLink(href)) {
          return href;
        }
      }
    }
  }
  return null;
}

// 提取分页链接
function extractPaginationLink(document, direction, currentUrl) {
  try {
    const urlObj = new URL(currentUrl);
    const pathname = urlObj.pathname;

    // 模式 1: /page/2 -> /page/3
    const pageMatch = pathname.match(/\/page\/(\d+)/i);
    if (pageMatch) {
      const currentPage = parseInt(pageMatch[1]);
      const nextPage = currentPage + direction;
      if (nextPage > 0) {
        const newPath = pathname.replace(/\/page\/\d+/i, `/page/${nextPage}`);
        urlObj.pathname = newPath;
        return urlObj.toString();
      }
    }

    // 模式 2: ?page=2 -> ?page=3
    const pageParam = urlObj.searchParams.get('page');
    if (pageParam) {
      const currentPage = parseInt(pageParam);
      const nextPage = currentPage + direction;
      if (nextPage > 0) {
        urlObj.searchParams.set('page', nextPage.toString());
        return urlObj.toString();
      }
    }

    // 模式 3: /2/ -> /3/
    const numMatch = pathname.match(/\/(\d+)\/$/);
    if (numMatch) {
      const currentPage = parseInt(numMatch[1]);
      const nextPage = currentPage + direction;
      if (nextPage > 0) {
        const newPath = pathname.replace(/\/\d+\/$/, `/${nextPage}/`);
        urlObj.pathname = newPath;
        return urlObj.toString();
      }
    }
  } catch (e) {
    console.error('Error parsing URL for pagination:', e);
  }
  return null;
}

function isValidLink(href) {
  if (!href || href.startsWith('javascript:') || href.startsWith('#')) {
    return false;
  }
  return true;
}

// Vercel Serverless 兼容：导出 app 作为 handler
module.exports = app;
