/**
 * Minimal markdown-to-JSX renderer (no external library needed)
 * Supports: **bold**, *italic*, bullet lists (- and *), numbered lists, inline code `code`
 */
import React from 'react';

export function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      elements.push(<br key={key++} />);
      i++;
      continue;
    }

    // Unordered list item — must start with '- ' or '* ' (NOT ** bold)
    // or start with specific emoji bullets that are clearly bullets
    const trimmed = line.trim();
    const isListItem = /^[-]\s+/.test(trimmed)
      || /^\*\s+/.test(trimmed)  // '* text' but NOT '**text'
      || /^[✅🎯📅💡📱🤝🏅🛡️🏛️🔒☁️🌍🕵️🎖️🏆🌟🔗📋🚀💰✨📞🎓🏫•]/.test(trimmed);

    if (isListItem) {
      const listItems = [];
      let j = i;
      while (j < lines.length) {
        const t = lines[j].trim();
        const isItem = /^[-]\s+/.test(t)
          || /^\*\s+/.test(t)
          || /^[✅🎯📅💡📱🤝🏅🛡️🏛️🔒☁️🌍🕵️🎖️🏆🌟🔗📋🚀💰✨📞🎓🏫•]/.test(t);
        if (!isItem) break;
        const itemText = t.replace(/^[-*]\s+/, '').trim();
        listItems.push(<li key={key++}>{inlineFormat(itemText)}</li>);
        j++;
      }
      i = j;
      elements.push(<ul key={key++} className="chat-md-list">{listItems}</ul>);
      continue;
    }

    // Numbered list
    if (/^\d+\./.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^\d+\./.test(lines[i]?.trim())) {
        const itemText = lines[i].replace(/^\d+\.\s*/, '').trim();
        listItems.push(<li key={key++}>{inlineFormat(itemText)}</li>);
        i++;
      }
      elements.push(<ol key={key++} className="chat-md-list">{listItems}</ol>);
      continue;
    }

    // Regular paragraph line
    elements.push(<p key={key++} className="chat-md-p">{inlineFormat(line)}</p>);
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // Split by bold (**text**), italic (*text*), inline code (`code`)
  const parts = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    // Bold — must come before italic check
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic (single * not preceded or followed by *)
    // Use a pattern that won't match ** bold markers
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/);
    // Inline code
    const codeMatch = remaining.match(/`(.+?)`/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch.index, match: boldMatch } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index, match: italicMatch } : null,
      codeMatch ? { type: 'code', index: codeMatch.index, match: codeMatch } : null,
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(<React.Fragment key={k++}>{remaining}</React.Fragment>);
      break;
    }

    const earliest = matches[0];
    if (earliest.index > 0) {
      parts.push(<React.Fragment key={k++}>{remaining.slice(0, earliest.index)}</React.Fragment>);
    }

    if (earliest.type === 'bold') {
      parts.push(<strong key={k++}>{earliest.match[1]}</strong>);
      remaining = remaining.slice(earliest.index + earliest.match[0].length);
    } else if (earliest.type === 'italic') {
      parts.push(<em key={k++}>{earliest.match[1]}</em>);
      remaining = remaining.slice(earliest.index + earliest.match[0].length);
    } else if (earliest.type === 'code') {
      parts.push(<code key={k++} className="chat-inline-code">{earliest.match[1]}</code>);
      remaining = remaining.slice(earliest.index + earliest.match[0].length);
    }
  }

  return parts;
}
