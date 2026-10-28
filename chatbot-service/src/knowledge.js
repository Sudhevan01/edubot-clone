import fs from 'node:fs';
import path from 'node:path';

class KnowledgeStore {
  constructor() {
    this.pages = new Map();
    this.rawContent = '';
    this.pageContents = new Map();
    this.loaded = false;
  }

  load(knowledgeDir) {
    const pagesFile = path.resolve(knowledgeDir, 'pages.json');
    const knowledgeFile = path.resolve(knowledgeDir, 'knowledge.md');

    if (!fs.existsSync(pagesFile)) {
      throw new Error(`pages.json missing at ${pagesFile}`);
    }
    if (!fs.existsSync(knowledgeFile)) {
      throw new Error(`knowledge.md missing at ${knowledgeFile}`);
    }

    // Parse pages.json
    let pagesData;
    try {
      const rawPages = fs.readFileSync(pagesFile, 'utf-8');
      pagesData = JSON.parse(rawPages);
    } catch (err) {
      throw new Error(`pages.json is malformed JSON: ${err.message}`);
    }

    if (!Array.isArray(pagesData) || pagesData.length === 0) {
      throw new Error('pages.json must contain a non-empty list of page objects');
    }

    const parsedPages = new Map();
    for (const item of pagesData) {
      if (!item || typeof item !== 'object') {
        throw new Error('pages.json items must be objects');
      }
      for (const reqKey of ['key', 'label', 'url']) {
        if (!item[reqKey] || typeof item[reqKey] !== 'string' || !item[reqKey].trim()) {
          throw new Error(`pages.json item missing or invalid field '${reqKey}': ${JSON.stringify(item)}`);
        }
      }
      parsedPages.set(item.key, {
        key: item.key,
        label: item.label,
        url: item.url,
      });
    }

    // Parse knowledge.md
    const content = fs.readFileSync(knowledgeFile, 'utf-8').trim();
    if (!content) {
      throw new Error('knowledge.md file is empty');
    }

    // Parse sections separated by ## page: <key>
    const pageContents = new Map();
    const sections = content.split('## page: ');
    for (const sec of sections) {
      const secStr = sec.trim();
      if (!secStr) continue;
      const firstNewline = secStr.indexOf('\n');
      const pageKey = (firstNewline === -1 ? secStr : secStr.slice(0, firstNewline)).trim();
      const pageBody = firstNewline === -1 ? '' : secStr.slice(firstNewline + 1).trim();
      if (parsedPages.has(pageKey)) {
        pageContents.set(pageKey, pageBody);
      }
    }

    // Validate cross-referencing between pages.json and knowledge.md
    for (const key of parsedPages.keys()) {
      if (!pageContents.has(key)) {
        throw new Error(`Page key '${key}' from pages.json not found in knowledge.md`);
      }
    }

    this.pages = parsedPages;
    this.rawContent = content;
    this.pageContents = pageContents;
    this.loaded = true;
  }
}

const store = new KnowledgeStore();

export function loadKnowledge(knowledgeDir) {
  store.load(knowledgeDir);
}

export function getPageByKey(key) {
  if (!key) return null;
  return store.pages.get(key) || null;
}

export function getAllPages() {
  return Object.fromEntries(store.pages);
}

export function getKnowledgeContent() {
  return store.rawContent;
}

export function isKnowledgeLoaded() {
  return store.loaded;
}

export default {
  loadKnowledge,
  getPageByKey,
  getAllPages,
  getKnowledgeContent,
  isKnowledgeLoaded,
};
