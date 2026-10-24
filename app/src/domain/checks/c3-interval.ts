import type { CheckContext, CheckResult, Issue } from './types';
import { chapterNoOf } from './types';

/** C3 埋了太久没提：只对未闭合的钩子有意义 */
export function checkC3(ctx: CheckContext): CheckResult {
  const issues: Issue[] = [];
  const threshold = ctx.settings.c3Interval;
  let scanned = 0;

  for (const e of ctx.entities) {
    if (e.type !== 'hook') continue;

    const rels = ctx.links.filter((l) => l.entityId === e.id);
    const plants = rels
      .filter((r) => r.role === 'plant')
      .map((r) => chapterNoOf(ctx, r.chapterId));
    if (plants.length === 0) continue;

    scanned++;

    const closed = rels.some((r) => r.role === 'pay' || r.role === 'drop');
    if (closed) continue;

    const plantNo = Math.min(...plants);
    const hints = rels.filter((r) => r.role === 'hint').map((r) => chapterNoOf(ctx, r.chapterId));
    const lastTouch = hints.length > 0 ? Math.max(...hints) : plantNo;
    const gap = ctx.maxChapterNo - lastTouch;

    if (gap <= threshold) continue;
    if (ctx.acks.some((a) => a.entityId === e.id && a.checkId === 'C3')) continue;

    issues.push({
      entityId: e.id,
      entityName: e.name,
      checkId: 'C3',
      reason: `「${e.name}」埋在第 ${plantNo} 章，最后提到是第 ${lastTouch} 章，已过去 ${gap} 章`,
      chapters: [plantNo, lastTouch],
      severity: 'mid'
    });
  }

  return { checkId: 'C3', title: '提醒 · 埋太久没提', issues, scanned };
}
