import type { Entity, EntityType, Link, Role } from './types';

/**
 * 每种实体允许的关联动作。
 *
 * 只有「钩子」存在闭合问题（埋 → 提 → 收 / 弃）。
 * 人物是出场；线是推进；
 * 道具没有回收概念 —— 它只在某章出现、在谁手里，所以是「出现 / 易手」。
 */
export const ROLE_BY_TYPE: Record<EntityType, Role[]> = {
  character: ['appear'],
  hook: ['plant', 'hint', 'pay', 'drop'],
  prop: ['appear', 'hold'],
  thread: ['appear']
};

export function isRoleAllowed(type: EntityType, role: Role): boolean {
  return ROLE_BY_TYPE[type]?.includes(role) ?? false;
}

export function defaultRole(type: EntityType): Role {
  return ROLE_BY_TYPE[type]?.[0] ?? 'appear';
}

/**
 * 过滤掉类型与动作不匹配的关联，也丢掉找不到实体的孤儿关联。
 * 用于导入旧数据时的一次性净化。
 */
export function sanitizeLinks(entities: Entity[], links: Link[]): Link[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  return links.filter((l) => {
    const e = byId.get(l.entityId);
    return e ? isRoleAllowed(e.type, l.role) : false;
  });
}
