import type { CheckContext, CheckResult, Issue } from './types';
import { chapterNoOf } from './types';

/**
 * C5 关系跳变没有转折点。
 *
 * 只查两件事，都很硬：
 * 1. 起始和结束状态不一样，却没写在哪一章变的 → 读者会觉得中间缺了一场戏
 * 2. 写了变化章，但那一章两个人一个都没出场 → 这场变化没有落点
 *
 * 状态没变的关系不检查：它不是缺陷，只是一条静态关系。
 */
export function checkC5(ctx: CheckContext): CheckResult {
  const issues: Issue[] = [];
  let scanned = 0;

  for (const r of ctx.relations) {
    const a = ctx.entities.find((e) => e.id === r.aId);
    const b = ctx.entities.find((e) => e.id === r.bId);
    if (!a || !b) continue;

    scanned++;

    const from = r.from.trim();
    const to = r.to.trim();
    const changed = from !== '' && to !== '' && from !== to;
    const pair = `${a.name} — ${b.name}`;

    if (changed && !r.changedAt) {
      if (ctx.acks.some((x) => x.entityId === r.id && x.checkId === 'C5')) continue;
      issues.push({
        entityId: r.id,
        entityName: pair,
        checkId: 'C5',
        reason: `「${pair}」从「${from}」变成「${to}」，但没写在哪一章变的`,
        chapters: [],
        severity: 'high'
      });
      continue;
    }

    if (r.changedAt) {
      const no = chapterNoOf(ctx, r.changedAt);
      const appears = (id: string) =>
        ctx.links.some(
          (l) => l.entityId === id && l.role === 'appear' && chapterNoOf(ctx, l.chapterId) === no
        );

      // 两个人都不在场，这场变化就没有落点；只要有一个人在场就不算错
      if (!appears(a.id) && !appears(b.id)) {
        if (ctx.acks.some((x) => x.entityId === r.id && x.checkId === 'C5')) continue;
        issues.push({
          entityId: r.id,
          entityName: pair,
          checkId: 'C5',
          reason: `「${pair}」标在第 ${no} 章变化，但这一章两个人一个都没出场`,
          chapters: [no],
          severity: 'mid'
        });
      }
    }
  }

  return { checkId: 'C5', title: '待补 · 关系变了没说在哪变', issues, scanned };
}
