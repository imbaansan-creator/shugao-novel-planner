import { describe, it, expect } from 'vitest';
import { renumber, moveSection } from './chapters';
import type { Chapter } from './types';

function mkChapter(no: number, id: string): Chapter {
  return {
    id,
    no,
    title: '',
    summary: '',
    change: '',
    timeLabel: '',
    timeKind: '',
    status: 'todo',
    level: 'chapter',
    parentId: null
  };
}

function mkSection(no: number, parentId: string, id: string): Chapter {
  return {
    id,
    no,
    title: '',
    summary: '',
    change: '',
    timeLabel: '',
    timeKind: '',
    status: 'todo',
    level: 'section',
    parentId
  };
}

describe('renumber 重排编号', () => {
  it('删掉中间的节之后，节号补成连续', () => {
    const chapters = [
      mkChapter(1, 'c1'),
      mkSection(1, 'c1', 's1'),
      mkSection(3, 'c1', 's3'),
      mkSection(7, 'c1', 's7')
    ];
    const out = renumber(chapters);
    const secs = out.filter((c) => c.level === 'section');
    expect(secs.map((s) => s.no)).toEqual([1, 2, 3]);
  });

  it('章号也补成连续', () => {
    const chapters = [mkChapter(1, 'c1'), mkChapter(9, 'c9')];
    const out = renumber(chapters);
    expect(out.filter((c) => c.level === 'chapter').map((c) => c.no)).toEqual([1, 2]);
  });

  it('节的号在各自章内独立重排', () => {
    const chapters = [
      mkChapter(1, 'c1'),
      mkChapter(2, 'c2'),
      mkSection(4, 'c1', 'a4'),
      mkSection(9, 'c2', 'b9'),
      mkSection(2, 'c1', 'a2')
    ];
    const out = renumber(chapters);
    const byParent = (pid: string) =>
      out
        .filter((c) => c.level === 'section' && c.parentId === pid)
        .sort((x, y) => x.no - y.no)
        .map((s) => s.no);

    expect(byParent('c1')).toEqual([1, 2]);
    expect(byParent('c2')).toEqual([1]);
  });

  it('不丢失找不到父章的孤儿节', () => {
    const chapters = [mkChapter(1, 'c1'), mkSection(1, 'gone', 'orphan')];
    const out = renumber(chapters);
    expect(out.find((c) => c.id === 'orphan')).toBeTruthy();
  });
});

describe('moveSection 上下移', () => {
  const base = () => [
    mkChapter(1, 'c1'),
    mkSection(1, 'c1', 's1'),
    mkSection(2, 'c1', 's2'),
    mkSection(3, 'c1', 's3')
  ];

  it('下移：与下一个交换编号', () => {
    const out = moveSection(base(), 's1', 1);
    const map = Object.fromEntries(
      out.filter((c) => c.level === 'section').map((s) => [s.id, s.no])
    );
    expect(map.s1).toBe(2);
    expect(map.s2).toBe(1);
    expect(map.s3).toBe(3);
  });

  it('上移：与上一个交换编号', () => {
    const out = moveSection(base(), 's3', -1);
    const map = Object.fromEntries(
      out.filter((c) => c.level === 'section').map((s) => [s.id, s.no])
    );
    expect(map.s3).toBe(2);
    expect(map.s2).toBe(3);
  });

  it('第一个再上移，原样返回', () => {
    const input = base();
    const out = moveSection(input, 's1', -1);
    expect(out).toBe(input);
  });

  it('最后一个再下移，原样返回', () => {
    const input = base();
    const out = moveSection(input, 's3', 1);
    expect(out).toBe(input);
  });

  it('不跨章移动', () => {
    const chapters = [
      mkChapter(1, 'c1'),
      mkChapter(2, 'c2'),
      mkSection(1, 'c1', 'a1'),
      mkSection(1, 'c2', 'b1')
    ];
    const out = moveSection(chapters, 'a1', 1);
    expect(out).toBe(chapters);
  });
});
