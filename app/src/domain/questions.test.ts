import { describe, it, expect } from 'vitest';
import { QUESTIONS, STAGES, questionStats } from './questions';
import type { Answer } from './types';

const mk = (questionId: string, state: Answer['state']): Answer => ({
  questionId,
  text: '',
  state,
  updatedAt: 0
});

describe('问句库', () => {
  it('题目 id 不重复', () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(QUESTIONS.length);
  });

  it('每个阶段都有题，每条题都挂在一个存在的阶段上', () => {
    const stageIds = new Set(STAGES.map((s) => s.id));
    for (const s of STAGES) {
      expect(QUESTIONS.some((q) => q.stage === s.id)).toBe(true);
    }
    for (const q of QUESTIONS) {
      expect(stageIds.has(q.stage)).toBe(true);
    }
  });

  it('一次不会被题目数量压倒：单个阶段不超过 8 条', () => {
    for (const s of STAGES) {
      expect(QUESTIONS.filter((q) => q.stage === s.id).length).toBeLessThanOrEqual(8);
    }
  });
});

describe('questionStats', () => {
  it('没有任何回答时，全部算未答', () => {
    const s = questionStats([]);
    expect(s.total).toBe(QUESTIONS.length);
    expect(s.blank).toBe(QUESTIONS.length);
    expect(s.confirmed).toBe(0);
  });

  it('按题目统计，不是按答案条数', () => {
    const s = questionStats([
      mk(QUESTIONS[0].id, 'confirmed'),
      mk(QUESTIONS[0].id, 'confirmed'),
      mk(QUESTIONS[1].id, 'draft')
    ]);
    expect(s.confirmed).toBe(1);
    expect(s.draft).toBe(1);
    expect(s.blank).toBe(QUESTIONS.length - 2);
  });

  it('「不适用」不算未答，也不算已确认', () => {
    const s = questionStats([mk(QUESTIONS[0].id, 'na')]);
    expect(s.na).toBe(1);
    expect(s.blank).toBe(QUESTIONS.length - 1);
    expect(s.confirmed).toBe(0);
  });

  it('五项加起来等于总数', () => {
    const s = questionStats([
      mk(QUESTIONS[0].id, 'confirmed'),
      mk(QUESTIONS[1].id, 'draft'),
      mk(QUESTIONS[2].id, 'pending'),
      mk(QUESTIONS[3].id, 'na')
    ]);
    expect(s.blank + s.draft + s.pending + s.confirmed + s.na).toBe(s.total);
  });
});
