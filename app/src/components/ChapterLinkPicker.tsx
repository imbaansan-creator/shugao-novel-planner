import { useMemo } from 'react';
import { useStore } from '../store/store';
import type { EntityType, Role } from '../domain/types';
import { ROLE_LABEL, chapterLabel } from '../domain/types';
import { ROLE_BY_TYPE } from '../domain/roles';

const GROUPS: { type: EntityType; label: string }[] = [
  { type: 'character', label: '人物' },
  { type: 'hook', label: '钩子' },
  { type: 'prop', label: '道具' },
  { type: 'thread', label: '线' }
];

export default function ChapterLinkPicker({
  chapterId,
  onClose
}: {
  chapterId: string;
  onClose: () => void;
}) {
  const { data, dispatch } = useStore();

  const chapter = data.chapters.find((c) => c.id === chapterId);

  const grouped = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: data.entities.filter((e) => e.type === g.type)
      })),
    [data.entities]
  );

  if (!chapter) return null;

  const toggle = (entityId: string, role: Role) => {
    const existing = data.links.find(
      (l) => l.entityId === entityId && l.chapterId === chapterId && l.role === role
    );
    if (existing) {
      dispatch({ type: 'link/remove', id: existing.id });
    } else {
      dispatch({ type: 'link/add', entityId, chapterId, role });
    }
  };

  return (
    <div className="picker-scrim" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <div>
            <span style={{ fontWeight: 500 }}>{chapterLabel(chapter, data.chapters)}</span>
            {chapter.title && (
              <span style={{ color: 'var(--text-3)', marginLeft: 8 }}>{chapter.title}</span>
            )}
          </div>
          <button className="btn ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="picker-body">
          {grouped.map((g) => (
            <div key={g.type} className="picker-group">
              <div className="picker-group-head">
                {g.label}
                <span className="n">{g.items.length}</span>
              </div>

              {g.items.length === 0 && (
                <div className="quiet" style={{ padding: '6px 0' }}>
                  还没有{g.label}。
                </div>
              )}

              {g.items.map((e) => (
                <div className="picker-row" key={e.id}>
                  <span className="picker-name" title={e.name}>
                    {e.code ? <span className="picker-code">{e.code}</span> : null}
                    {e.name}
                  </span>
                  <span className="picker-roles">
                    {(ROLE_BY_TYPE[g.type] ?? []).map((r) => {
                      const on = data.links.some(
                        (l) =>
                          l.entityId === e.id &&
                          l.chapterId === chapterId &&
                          l.role === r
                      );
                      return (
                        <button
                          key={r}
                          className={`role-btn ${on ? 'on' : ''}`}
                          onClick={() => toggle(e.id, r)}
                          title={on ? '点击取下' : `挂上「${ROLE_LABEL[r]}」`}
                        >
                          {ROLE_LABEL[r]}
                        </button>
                      );
                    })}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="picker-foot">
          点一下挂上，再点一下取下。改动立即生效。
        </div>
      </div>
    </div>
  );
}
