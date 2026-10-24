import type { CheckContext, CheckResult, Issue } from './types';
import { chapterNoOf, isClosable } from './types';

/** C1 埋了没收：有埋、无收、无弃 */
export function checkC1(ctx: CheckContext): CheckResult {
  const issues: Issue[] = [];
  let scanned = 0;

  for (const e of ctx.entities) {
    if (!isClosable(e)) continue;
    // 软钩子允许不收：它的作用是让世界显得比故事大，不是欠读者的债。
    // 把它算进「埋了没收」，作者就会被逼着给每个氛围细节编一个回收。
    if (e.data.hardness === 'soft') continue;

    const rels = ctx.links.filter((l) => l.entityId === e.id);
    const plant = rels.find((r) => r.role === 'plant');
    if (!plant) continue;

    scanned++;

    const hasPay = rels.some((r) => r.role === 'pay');
    const hasDrop = rels.some((r) => r.role === 'drop');
    if (hasPay || hasDrop) continue;

    if (ctx.acks.some((a) => a.entityId === e.id && a.checkId === 'C1')) continue;

    const plantNo = chapterNoOf(ctx, plant.chapterId);
    issues.push({
      entityId: e.id,
      entityName: e.name,
      checkId: 'C1',
      reason: `第 ${plantNo} 章埋的「${e.name}」，到第 ${ctx.maxChapterNo} 章还没收`,
      chapters: [plantNo],
      severity: 'high'
    });
  }

  return { checkId: 'C1', title: '待还 · 埋了没收', issues, scanned };
}
