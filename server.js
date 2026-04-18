const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 提取网页内容的 API
app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 获取网页内容
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

    // 返回提取的内容
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

// 提取导航链接（通过链接文本匹配）
function extractNavLink(document, keywords) {
  const links = document.querySelectorAll('a');
  
  for (const link of links) {
    const text = link.textContent.trim().toLowerCase();
    const href = link.href;
    
    // 检查链接文本是否包含关键词
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // 验证是否是有效链接（同一域名或相对路径）
        if (isValidLink(href)) {
          return href;
        }
      }
    }
  }
  
  return null;
}

// 提取分页链接（通过 URL 参数如 ?page=2, /page/2 等）
function extractPaginationLink(document, direction, currentUrl) {
  try {
    const urlObj = new URL(currentUrl);
    const pathname = urlObj.pathname;
    
    // 尝试匹配常见的分页模式
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
    
    // 模式 3: /2/ -> /3/ (小说站常见)
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

// 验证链接是否有效
function isValidLink(href) {
  if (!href || href.startsWith('javascript:') || href.startsWith('#')) {
    return false;
  }
  // 允许相对链接和绝对链接
  return true;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vercel Serverless 兼容：导出 handler 而不是启动监听
module.exports = app;
