import { describe, it, expect } from 'vitest';
import { isRoleAllowed, defaultRole, sanitizeLinks } from './roles';
import type { Entity, Link } from './types';

function mkEntity(id: string, type: Entity['type']): Entity {
  return { id, type, code: '', name: id, layer: '', data: {}, planned: null };
}

function mkLink(id: string, entityId: string, role: Link['role']): Link {
  return { id, entityId, chapterId: 'c1', role, note: '' };
}

describe('角色与类型的约束', () => {
  it('人物只能「出场」，不能有埋提收弃', () => {
    expect(isRoleAllowed('character', 'appear')).toBe(true);
    expect(isRoleAllowed('character', 'plant')).toBe(false);
    expect(isRoleAllowed('character', 'hint')).toBe(false);
    expect(isRoleAllowed('character', 'pay')).toBe(false);
    expect(isRoleAllowed('character', 'drop')).toBe(false);
  });

  it('只有钩子有埋提收弃', () => {
    expect(isRoleAllowed('hook', 'plant')).toBe(true);
    expect(isRoleAllowed('hook', 'hint')).toBe(true);
    expect(isRoleAllowed('hook', 'pay')).toBe(true);
    expect(isRoleAllowed('hook', 'drop')).toBe(true);
    expect(isRoleAllowed('hook', 'appear')).toBe(false);
  });

  it('道具只有出现和易手，没有回收概念', () => {
    expect(isRoleAllowed('prop', 'appear')).toBe(true);
    expect(isRoleAllowed('prop', 'hold')).toBe(true);
    expect(isRoleAllowed('prop', 'plant')).toBe(false);
    expect(isRoleAllowed('prop', 'hint')).toBe(false);
    expect(isRoleAllowed('prop', 'pay')).toBe(false);
    expect(isRoleAllowed('prop', 'drop')).toBe(false);
  });

  it('线只有出场', () => {
    expect(isRoleAllowed('thread', 'appear')).toBe(true);
    expect(isRoleAllowed('thread', 'plant')).toBe(false);
  });

  it('默认动作按类型给', () => {
    expect(defaultRole('character')).toBe('appear');
    expect(defaultRole('hook')).toBe('plant');
    expect(defaultRole('thread')).toBe('appear');
  });
});

describe('sanitizeLinks 清理非法关联', () => {
  it('删掉人物身上的「埋」，保留「出场」', () => {
    const entities = [mkEntity('p1', 'character')];
    const links = [
      mkLink('l1', 'p1', 'plant'),
      mkLink('l2', 'p1', 'appear')
    ];
    const out = sanitizeLinks(entities, links);
    expect(out.map((l) => l.role)).toEqual(['appear']);
  });

  it('保留钩子的埋提收，删掉钩子的出场', () => {
    const entities = [mkEntity('h1', 'hook')];
    const links = [
      mkLink('l1', 'h1', 'plant'),
      mkLink('l2', 'h1', 'hint'),
      mkLink('l3', 'h1', 'appear')
    ];
    const out = sanitizeLinks(entities, links);
    expect(out.map((l) => l.role)).toEqual(['plant', 'hint']);
  });

  it('丢掉找不到实体的孤儿关联', () => {
    const entities = [mkEntity('h1', 'hook')];
    const links = [mkLink('l1', 'h1', 'plant'), mkLink('l2', 'ghost', 'plant')];
    const out = sanitizeLinks(entities, links);
    expect(out).toHaveLength(1);
    expect(out[0].entityId).toBe('h1');
  });
});
