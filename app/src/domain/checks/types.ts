import type { Chapter, Entity, Link, Ack, Settings, Relation } from '../types';
import { normalizeChapterNo } from '../types';

export interface CheckContext {
  chapters: Chapter[];
  entities: Entity[];
  links: Link[];
  acks: Ack[];
  settings: Settings;
  relations: Relation[];
  maxChapterNo: number;
}

export interface Issue {
  entityId: string;
  entityName: string;
  checkId: 'C1' | 'C2' | 'C3' | 'C4' | 'C5';
  reason: string;
  chapters: number[];
  severity: 'high' | 'mid';
}

export interface CheckResult {
  checkId: 'C1' | 'C2' | 'C3' | 'C4' | 'C5';
  title: string;
  issues: Issue[];
  /** 参与本次计算的记录数。必须返回，用于表达报告可信度。 */
  scanned: number;
}

export function chapterNoOf(ctx: CheckContext, chapterId: string): number {
  const c = ctx.chapters.find((x) => x.id === chapterId);
  return c ? normalizeChapterNo(c, ctx.chapters) : 0;
}

export function buildContext(
  chapters: Chapter[],
  entities: Entity[],
  links: Link[],
  acks: Ack[],
  settings: Settings,
  relations: Relation[] = []
): CheckContext {
  // 间隔一律按「章」计算，节不参与
  const maxChapterNo = chapters
    .filter((c) => c.level === 'chapter')
    .reduce((m, c) => Math.max(m, c.no), 0);
  return { chapters, entities, links, acks, settings, relations, maxChapterNo };
}

/** 只有钩子有闭合问题。道具只在某章出现、在谁手里，不存在「回收」。 */
export function isClosable(e: Entity): boolean {
  return e.type === 'hook';
}
