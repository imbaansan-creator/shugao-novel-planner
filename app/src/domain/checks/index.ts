import type { Chapter, Entity, Link, Ack, Settings, Relation } from '../types';
import { buildContext, type CheckContext, type CheckResult } from './types';
import { checkC1 } from './c1-unpaid';
import { checkC2 } from './c2-groundless';
import { checkC3 } from './c3-interval';
import { checkC4 } from './c4-stale';
import { checkC5 } from './c5-relation';

export type { CheckContext, CheckResult, Issue } from './types';
export { buildContext } from './types';

/** 跑完四类检查 */
export function runAllChecks(ctx: CheckContext): CheckResult[] {
  return [checkC1(ctx), checkC2(ctx), checkC3(ctx), checkC4(ctx), checkC5(ctx)];
}

/**
 * 一章都没有挂任何关联的章节。
 *
 * 关联现在挂在「节」上，所以判断一章有没有记录过，不能只看章自己：
 * 只要它下面任意一节有标注，这一章就算记录过。
 * 节本身不单独上报 —— 大多数节本来就不挂东西，逐节上报只会变成噪音。
 */
export function findUnmarkedChapters(chapters: Chapter[], links: Link[]): Chapter[] {
  const marked = new Set(links.map((l) => l.chapterId));
  const markedParents = new Set<string>();
  for (const c of chapters) {
    if (c.level === 'section' && c.parentId && marked.has(c.id)) markedParents.add(c.parentId);
  }
  return chapters.filter(
    (c) => c.level === 'chapter' && !marked.has(c.id) && !markedParents.has(c.id)
  );
}

export function runWithData(
  chapters: Chapter[],
  entities: Entity[],
  links: Link[],
  acks: Ack[],
  settings: Settings,
  relations: Relation[] = []
): { results: CheckResult[]; unmarked: Chapter[]; totalScanned: number; entityCount: number } {
  const ctx = buildContext(chapters, entities, links, acks, settings, relations);
  const results = runAllChecks(ctx);
  const unmarked = findUnmarkedChapters(chapters, links);
  return {
    results,
    unmarked,
    totalScanned: results.reduce((s, r) => s + r.scanned, 0),
    entityCount: entities.filter((e) => e.type === 'hook' || e.type === 'prop' || e.type === 'thread')
      .length
  };
}
