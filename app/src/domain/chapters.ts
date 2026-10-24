import type { Chapter } from './types';

/** 章号与节号一律重排成 1..n，避免删掉中间几条后出现空号 */
export function renumber(chapters: Chapter[]): Chapter[] {
  const tops = chapters.filter((c) => c.level === 'chapter').sort((a, b) => a.no - b.no);
  const out: Chapter[] = [];

  tops.forEach((ch, i) => {
    out.push({ ...ch, no: i + 1 });
    chapters
      .filter((s) => s.level === 'section' && s.parentId === ch.id)
      .sort((a, b) => a.no - b.no)
      .forEach((s, j) => out.push({ ...s, no: j + 1 }));
  });

  // 兜底：父章已不存在的孤儿节，原样接在后面，不静默丢弃
  const seen = new Set(out.map((c) => c.id));
  for (const c of chapters) {
    if (!seen.has(c.id)) out.push(c);
  }

  return out;
}

/** 上移 / 下移一个节。只在同一章内交换，不跨章 */
export function moveSection(chapters: Chapter[], id: string, dir: -1 | 1): Chapter[] {
  const target = chapters.find((c) => c.id === id);
  if (!target || target.level !== 'section' || !target.parentId) return chapters;

  const siblings = chapters
    .filter((c) => c.level === 'section' && c.parentId === target.parentId)
    .sort((a, b) => a.no - b.no);

  const idx = siblings.findIndex((s) => s.id === target.id);
  const swapIdx = idx + dir;
  if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return chapters;

  const a = siblings[idx];
  const b = siblings[swapIdx];

  return chapters.map((c) => {
    if (c.id === a.id) return { ...c, no: b.no };
    if (c.id === b.id) return { ...c, no: a.no };
    return c;
  });
}

/** 按章分组、组内按节号排序，用于渲染 */
export function orderChapters(chapters: Chapter[]): Chapter[] {
  const tops = chapters.filter((c) => c.level === 'chapter').sort((a, b) => a.no - b.no);
  const out: Chapter[] = [];
  for (const ch of tops) {
    out.push(ch);
    chapters
      .filter((s) => s.level === 'section' && s.parentId === ch.id)
      .sort((a, b) => a.no - b.no)
      .forEach((s) => out.push(s));
  }
  return out;
}
