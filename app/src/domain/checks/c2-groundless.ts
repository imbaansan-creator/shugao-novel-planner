import type { CheckContext, CheckResult, Issue } from './types';
import { chapterNoOf, isClosable } from './types';

/** C2 收了没埋：有收、无埋 */
export function checkC2(ctx: CheckContext): CheckResult {
  const issues: Issue[] = [];
  let scanned = 0;

  for (const e of ctx.entities) {
    if (!isClosable(e)) continue;

    const rels = ctx.links.filter((l) => l.entityId === e.id);
    const pay = rels.find((r) => r.role === 'pay');
    if (!pay) continue;

    scanned++;

    const hasPlant = rels.some((r) => r.role === 'plant');
    if (hasPlant) continue;

    if (ctx.acks.some((a) => a.entityId === e.id && a.checkId === 'C2')) continue;

    const payNo = chapterNoOf(ctx, pay.chapterId);
    issues.push({
      entityId: e.id,
      entityName: e.name,
      checkId: 'C2',
      reason: `第 ${payNo} 章收了「${e.name}」，但全书没有埋过`,
      chapters: [payNo],
      severity: 'high'
    });
  }

  return { checkId: 'C2', title: '待补 · 收了没埋', issues, scanned };
}
