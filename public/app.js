// 状态管理
let currentTheme = 'light';
let currentFontSize = 'medium';

// DOM 元素
const urlInput = document.getElementById('urlInput');
const readBtn = document.getElementById('readBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const reader = document.getElementById('reader');
const articleTitle = document.getElementById('articleTitle');
const articleByline = document.getElementById('articleByline');
const articleSite = document.getElementById('articleSite');
const articleLength = document.getElementById('articleLength');
const articleContent = document.getElementById('articleContent');
const themeToggle = document.getElementById('themeToggle');
const fontSizeDown = document.getElementById('fontSizeDown');
const fontSizeUp = document.getElementById('fontSizeUp');
const backBtn = document.getElementById('backBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const chapterSelect = document.getElementById('chapterSelect');

// 主题切换
const themes = ['light', 'dark', 'eye-care'];
let themeIndex = 0;
themeToggle.addEventListener('click', () => {
  themeIndex = (themeIndex + 1) % themes.length;
  currentTheme = themes[themeIndex];
  document.documentElement.setAttribute('data-theme', currentTheme);
  const icons = { light: '🌙', dark: '☀️', 'eye-care': '👁️' };
  themeToggle.textContent = icons[currentTheme];
});

// 字体大小调整
const fontSizes = ['small', 'medium', 'large', 'xlarge'];
let fontSizeIndex = 1;
fontSizeDown.addEventListener('click', () => {
  fontSizeIndex = Math.max(0, fontSizeIndex - 1);
  updateFontSize();
});
fontSizeUp.addEventListener('click', () => {
  fontSizeIndex = Math.min(fontSizes.length - 1, fontSizeIndex + 1);
  updateFontSize();
});

function updateFontSize() {
  currentFontSize = fontSizes[fontSizeIndex];
  document.documentElement.setAttribute('data-font-size', currentFontSize);
}

// 提取内容
readBtn.addEventListener('click', extractContent);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') extractContent();
});

async function extractContent() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('请输入网址链接');
    return;
  }
  try {
    new URL(url);
  } catch {
    showError('请输入有效的网址链接');
    return;
  }

  loading.classList.remove('hidden');
  error.classList.add('hidden');
  reader.classList.add('hidden');
  readBtn.disabled = true;

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '提取失败');
    }
    displayArticle(data);
  } catch (err) {
    showError(err.message || '无法提取内容，请检查链接是否正确');
  } finally {
    loading.classList.add('hidden');
    readBtn.disabled = false;
  }
}

function displayArticle(data) {
  articleTitle.textContent = data.title || '无标题';
  articleByline.textContent = data.byline || '';
  articleSite.textContent = data.siteName ? `来自: ${data.siteName}` : '';
  articleLength.textContent = data.textContent ? `约 ${Math.ceil(data.textContent.length / 400)} 分钟阅读` : '';

  // 显示内容
  articleContent.innerHTML = data.content;

  // 提取章节并更新下拉菜单
  extractChapters();

  // 更新上一页/下一页按钮
  updateNavButtons(data.prevUrl, data.nextUrl);

  // 显示阅读器
  reader.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// 提取章节（从内容中的 h2, h3 标题）
function extractChapters() {
  const chapters = [];
  const content = articleContent;
  const headers = content.querySelectorAll('h2, h3');

  headers.forEach((header, index) => {
    const text = header.textContent.trim();
    if (text) {
      if (!header.id) {
        header.id = `chapter-${index}`;
      }
      chapters.push({
        id: header.id,
        text: text,
        level: header.tagName.toLowerCase()
      });
    }
  });

  updateChapterSelect(chapters);
}

function updateChapterSelect(chapters) {
  chapterSelect.innerHTML = '<option value="">📑 选择章节</option>';

  if (chapters.length === 0) {
    chapterSelect.disabled = true;
    return;
  }

  chapterSelect.disabled = false;

  chapters.forEach(chapter => {
    const option = document.createElement('option');
    option.value = `#${chapter.id}`;
    const indent = chapter.level === 'h3' ? '  └ ' : '📄 ';
    option.textContent = `${indent}${chapter.text}`;
    chapterSelect.appendChild(option);
  });
}

// 更新上一页/下一页按钮
function updateNavButtons(prevUrl, nextUrl) {
  prevBtn.disabled = !prevUrl;
  nextBtn.disabled = !nextUrl;
  prevBtn.style.opacity = prevUrl ? '1' : '0.5';
  nextBtn.style.opacity = nextUrl ? '1' : '0.5';

  prevBtn.onclick = () => {
    if (prevUrl) {
      urlInput.value = prevUrl;
      extractContent();
    }
  };

  nextBtn.onclick = () => {
    if (nextUrl) {
      urlInput.value = nextUrl;
      extractContent();
    }
  };
}

// 章节选择事件
chapterSelect.addEventListener('change', (e) => {
  const targetId = e.target.value;
  if (targetId) {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

function showError(message) {
  errorMessage.textContent = message;
  error.classList.remove('hidden');
}

// 返回按钮
backBtn.addEventListener('click', () => {
  reader.classList.add('hidden');
  urlInput.value = '';
  urlInput.focus();
});

// 初始化
document.documentElement.setAttribute('data-theme', currentTheme);
document.documentElement.setAttribute('data-font-size', currentFontSize);

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW failed:', err));
  });
}

// 移动端优化
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  document.addEventListener('dblclick', (e) => {
    e.preventDefault();
  }, { passive: false });
}
