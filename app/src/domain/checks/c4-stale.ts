import type { CheckContext, CheckResult, Issue } from './types';
import { chapterNoOf } from './types';

/** C4 线断了：某条线太久没有推进 */
export function checkC4(ctx: CheckContext): CheckResult {
  const issues: Issue[] = [];
  const threshold = ctx.settings.c4Stale;
  let scanned = 0;

  for (const e of ctx.entities) {
    if (e.type !== 'thread') continue;

    const rels = ctx.links.filter((l) => l.entityId === e.id);
    if (rels.length === 0) continue;

    scanned++;

    const lastNo = Math.max(...rels.map((r) => chapterNoOf(ctx, r.chapterId)));
    const gap = ctx.maxChapterNo - lastNo;
    if (gap <= threshold) continue;
    if (ctx.acks.some((a) => a.entityId === e.id && a.checkId === 'C4')) continue;

    issues.push({
      entityId: e.id,
      entityName: e.name,
      checkId: 'C4',
      reason: `线「${e.name}」最后出现在第 ${lastNo} 章，已 ${gap} 章没有推进`,
      chapters: [lastNo],
      severity: 'mid'
    });
  }

  return { checkId: 'C4', title: '提醒 · 线断了', issues, scanned };
}
