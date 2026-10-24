import { describe, it, expect } from 'vitest';
import { runWithData } from './index';
import type { Chapter, Entity, Link, Ack, Settings, Relation } from '../types';
import { uid } from '../types';

function mkChapters(n: number): Chapter[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i + 1}`,
    no: i + 1,
    title: `第${i + 1}章`,
    summary: '',
    change: '',
    timeLabel: '',
    timeKind: '' as const,
    status: 'todo' as const,
    level: 'chapter' as const,
    parentId: null
  }));
}

function mkSection(id: string, no: number, parentId: string): Chapter {
  return {
    id,
    no,
    title: `第${no}节`,
    summary: '',
    change: '',
    timeLabel: '',
    timeKind: '' as const,
    status: 'todo',
    level: 'section',
    parentId
  };
}

function mkHook(name: string, code = 'H1'): Entity {
  return {
    id: uid(),
    type: 'hook',
    code,
    name,
    layer: '',
    data: { readerAsk: '这是真的吗？', hardness: 'hard' },
    planned: null
  };
}

function mkThread(name: string): Entity {
  return { id: uid(), type: 'thread', code: '', name, layer: '', data: {}, planned: null };
}

function mkLink(entityId: string, chapterId: string, role: Link['role']): Link {
  return { id: uid(), entityId, chapterId, role, note: '' };
}

const baseSettings: Settings = { c3Interval: 15, c4Stale: 10 };

function run(
  chapters: Chapter[],
  entities: Entity[],
  links: Link[],
  acks: Ack[] = [],
  settings: Settings = baseSettings,
  relations: Relation[] = []
) {
  return runWithData(chapters, entities, links, acks, settings, relations);
}

function mkChar(name: string): Entity {
  return { id: uid(), type: 'character', code: '', name, layer: '', data: {}, planned: null };
}

describe('C1 埋了没收', () => {
  it('有埋无收 → 报一条', () => {
    const ch = mkChapters(3);
    const h = mkHook('发钗');
    const { results } = run(ch, [h], [mkLink(h.id, 'c1', 'plant')]);
    expect(results[0].issues).toHaveLength(1);
    expect(results[0].scanned).toBe(1);
  });

  it('有埋有收 → 不报', () => {
    const ch = mkChapters(3);
    const h = mkHook('发钗');
    const { results } = run(ch, [h], [
      mkLink(h.id, 'c1', 'plant'),
      mkLink(h.id, 'c3', 'pay')
    ]);
    expect(results[0].issues).toHaveLength(0);
    expect(results[0].scanned).toBe(1);
  });

  it('有埋已弃 → 不报', () => {
    const ch = mkChapters(3);
    const h = mkHook('发钗');
    const { results } = run(ch, [h], [
      mkLink(h.id, 'c1', 'plant'),
      mkLink(h.id, 'c2', 'drop')
    ]);
    expect(results[0].issues).toHaveLength(0);
  });

  it('已确认不改 → 不报，但仍计入 scanned', () => {
    const ch = mkChapters(3);
    const h = mkHook('发钗');
    const acks: Ack[] = [{ entityId: h.id, checkId: 'C1', reason: '' }];
    const { results } = run(ch, [h], [mkLink(h.id, 'c1', 'plant')], acks);
    expect(results[0].issues).toHaveLength(0);
    expect(results[0].scanned).toBe(1);
  });

  it('软钩子不进欠债表：允许不收，只是留个记号', () => {
    const ch = mkChapters(3);
    const h = mkHook('阿飞的身世');
    h.data.hardness = 'soft';
    const { results } = run(ch, [h], [mkLink(h.id, 'c1', 'plant')]);
    expect(results[0].issues).toHaveLength(0);
    expect(results[0].scanned).toBe(0);
  });

  it('没埋过 → 不报，也不计入 scanned', () => {
    const ch = mkChapters(3);
    const h = mkHook('发钗');
    const { results } = run(ch, [h], []);
    expect(results[0].issues).toHaveLength(0);
    expect(results[0].scanned).toBe(0);
  });
});

describe('C2 收了没埋', () => {
  it('有收无埋 → 报一条', () => {
    const ch = mkChapters(5);
    const h = mkHook('铜镜');
    const { results } = run(ch, [h], [mkLink(h.id, 'c4', 'pay')]);
    expect(results[1].issues).toHaveLength(1);
    expect(results[1].scanned).toBe(1);
  });

  it('有收有埋 → 不报', () => {
    const ch = mkChapters(5);
    const h = mkHook('铜镜');
    const { results } = run(ch, [h], [
      mkLink(h.id, 'c1', 'plant'),
      mkLink(h.id, 'c4', 'pay')
    ]);
    expect(results[1].issues).toHaveLength(0);
  });
});

describe('C3 埋了太久没提', () => {
  it('超过阈值且未闭合 → 报一条', () => {
    const ch = mkChapters(20);
    const h = mkHook('木像');
    const { results } = run(ch, [h], [mkLink(h.id, 'c1', 'plant')]);
    expect(results[2].issues).toHaveLength(1);
  });

  it('未超过阈值 → 不报', () => {
    const ch = mkChapters(5);
    const h = mkHook('木像');
    const { results } = run(ch, [h], [mkLink(h.id, 'c1', 'plant')]);
    expect(results[2].issues).toHaveLength(0);
  });

  it('中间提过，间隔从最后一次提算起', () => {
    const ch = mkChapters(20);
    const h = mkHook('木像');
    const { results } = run(ch, [h], [
      mkLink(h.id, 'c1', 'plant'),
      mkLink(h.id, 'c18', 'hint')
    ]);
    expect(results[2].issues).toHaveLength(0);
  });

  it('已收的钩子不做间隔检查', () => {
    const ch = mkChapters(30);
    const h = mkHook('木像');
    const { results } = run(ch, [h], [
      mkLink(h.id, 'c1', 'plant'),
      mkLink(h.id, 'c2', 'pay')
    ]);
    expect(results[2].issues).toHaveLength(0);
  });
});

describe('C4 线断了', () => {
  it('超过阈值 → 报一条', () => {
    const ch = mkChapters(20);
    const t = mkThread('龙啸云的堕落');
    const { results } = run(ch, [t], [mkLink(t.id, 'c1', 'appear')]);
    expect(results[3].issues).toHaveLength(1);
  });

  it('未超过阈值 → 不报', () => {
    const ch = mkChapters(5);
    const t = mkThread('龙啸云的堕落');
    const { results } = run(ch, [t], [mkLink(t.id, 'c1', 'appear')]);
    expect(results[3].issues).toHaveLength(0);
  });
});

describe('章 / 节分级', () => {
  it('挂在节上的关联，按所属章计算间隔', () => {
    const ch = mkChapters(20);
    const sec = mkSection('s1', 1, 'c1');
    const h = mkHook('木像');
    const { results } = run([...ch, sec], [h], [mkLink(h.id, 's1', 'plant')]);

    expect(results[0].issues).toHaveLength(1);
    expect(results[0].issues[0].reason).toContain('第 1 章');
    expect(results[2].issues).toHaveLength(1);
    expect(results[2].issues[0].reason).toContain('第 1 章');
  });

  it('节不参与最大章号的计算', () => {
    const ch = mkChapters(5);
    const sec = mkSection('s1', 9, 'c5');
    const h = mkHook('木像');
    const { results } = run([...ch, sec], [h], [mkLink(h.id, 'c1', 'plant')]);
    expect(results[2].issues).toHaveLength(0);
  });
});

describe('道具不参与闭合检查', () => {
  it('道具有「埋」也不进 C1', () => {
    const ch = mkChapters(3);
    const p: Entity = {
      id: 'p1',
      type: 'prop',
      code: 'P1',
      name: '发钗',
      layer: '',
      data: {},
      planned: null
    };
    const { results } = run(ch, [p], [{ id: 'l1', entityId: 'p1', chapterId: 'c1', role: 'plant', note: '' }]);
    expect(results[0].issues).toHaveLength(0);
    expect(results[0].scanned).toBe(0);
  });
});

describe('C5 关系跳变没有转折点', () => {
  const a = mkChar('甲');
  const b = mkChar('乙');
  const rel = (from: string, to: string, changedAt: string | null): Relation => ({
    id: 'r1',
    aId: a.id,
    bId: b.id,
    label: '朋友',
    from,
    to,
    changedAt,
    note: ''
  });

  it('状态变了但没写在哪一章 → 报一条', () => {
    const ch = mkChapters(5);
    const { results } = run(ch, [a, b], [], [], baseSettings, [rel('朋友', '仇敌', null)]);
    expect(results[4].issues).toHaveLength(1);
    expect(results[4].scanned).toBe(1);
  });

  it('起始和结束一样 → 不报', () => {
    const ch = mkChapters(5);
    const { results } = run(ch, [a, b], [], [], baseSettings, [rel('朋友', '朋友', null)]);
    expect(results[4].issues).toHaveLength(0);
  });

  it('标了章节且两人都出场 → 不报', () => {
    const ch = mkChapters(5);
    const links = [mkLink(a.id, 'c3', 'appear'), mkLink(b.id, 'c3', 'appear')];
    const { results } = run(ch, [a, b], links, [], baseSettings, [rel('朋友', '仇敌', 'c3')]);
    expect(results[4].issues).toHaveLength(0);
  });

  it('标了章节但两人都没出场 → 报一条', () => {
    const ch = mkChapters(5);
    const { results } = run(ch, [a, b], [], [], baseSettings, [rel('朋友', '仇敌', 'c3')]);
    expect(results[4].issues).toHaveLength(1);
    expect(results[4].issues[0].reason).toContain('第 3 章');
  });

  it('只有一方出场就不算错', () => {
    const ch = mkChapters(5);
    const links = [mkLink(a.id, 'c3', 'appear')];
    const { results } = run(ch, [a, b], links, [], baseSettings, [rel('朋友', '仇敌', 'c3')]);
    expect(results[4].issues).toHaveLength(0);
  });
});

describe('D1 约束：0 数据 ≠ 0 问题', () => {
  it('空数据时，四项检查的 scanned 全为 0', () => {
    const { results, unmarked } = run([], [], []);
    for (const r of results) {
      expect(r.scanned).toBe(0);
      expect(r.issues).toHaveLength(0);
    }
    expect(unmarked).toHaveLength(0);
  });

  it('有章节但无关联时，未标注数量等于章节数', () => {
    const ch = mkChapters(6);
    const { unmarked } = run(ch, [], []);
    expect(unmarked).toHaveLength(6);
  });

  it('关联挂在节上时，章不算「未标注」', () => {
    const ch = mkChapters(3);
    const sec = mkSection('s1', 1, 'c1');
    const h = mkHook('发钗');
    const { unmarked } = run([...ch, sec], [h], [mkLink(h.id, 's1', 'plant')]);
    expect(unmarked.map((c) => c.id)).not.toContain('c1');
    expect(unmarked.map((c) => c.id)).toEqual(['c2', 'c3']);
  });

  it('一节都没标注的章，仍然算「未标注」', () => {
    const ch = mkChapters(2);
    const sec = mkSection('s1', 1, 'c1');
    const h = mkHook('发钗');
    const { unmarked } = run([...ch, sec], [h], [mkLink(h.id, 'c2', 'plant')]);
    expect(unmarked.map((c) => c.id)).toEqual(['c1']);
  });

  it('有章节且都标注时，未标注为 0', () => {
    const ch = mkChapters(2);
    const h = mkHook('发钗');
    const { unmarked } = run(ch, [h], [
      mkLink(h.id, 'c1', 'plant'),
      mkLink(h.id, 'c2', 'hint')
    ]);
    expect(unmarked).toHaveLength(0);
  });
});
