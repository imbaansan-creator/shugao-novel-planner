import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, makeSampleData } from '../store/store';
import {
  STATUS_LABEL,
  type Chapter,
  type ChapterStatus,
  type Entity,
  type Link,
  type Role
} from '../domain/types';
import ChapterLinkPicker from '../components/ChapterLinkPicker';

const ROLE_SHORT: Record<Role, string> = {
  plant: '埋',
  hint: '提',
  pay: '收',
  drop: '弃',
  appear: '现',
  hold: '持'
};

const ROLE_LABEL_FULL: Record<Role, string> = {
  plant: '埋下',
  hint: '提到',
  pay: '收回',
  drop: '放弃',
  appear: '出现',
  hold: '易手'
};

/** 一个对象在一行里可能挂了好几个动作，取最重的那个上色 */
const ROLE_WEIGHT: Role[] = ['plant', 'pay', 'hint', 'drop', 'appear', 'hold'];

function primaryRole(roles: Role[]): Role {
  for (const r of ROLE_WEIGHT) if (roles.includes(r)) return r;
  return roles[0] ?? 'appear';
}

interface RowLink {
  entity: Entity;
  roles: Role[];
}

export default function ChapterTable() {
  const { data, dispatch } = useStore();
  const [picker, setPicker] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const autoExpanded = useRef(false);

  // 首次进入时，自动展开第一个有节的章，免得以为没数据
  useEffect(() => {
    if (autoExpanded.current) return;
    const withSections = data.chapters.find(
      (c) =>
        c.level === 'chapter' &&
        data.chapters.some((s) => s.level === 'section' && s.parentId === c.id)
    );
    if (withSections) {
      setExpanded(new Set([withSections.id]));
      autoExpanded.current = true;
    }
  }, [data.chapters]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sectionsOf = useMemo(() => {
    const m = new Map<string, Chapter[]>();
    for (const c of data.chapters) {
      if (c.level !== 'section' || !c.parentId) continue;
      const arr = m.get(c.parentId) ?? [];
      arr.push(c);
      m.set(c.parentId, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.no - b.no);
    return m;
  }, [data.chapters]);

  const linksByChapter = useMemo(() => {
    const m = new Map<string, Link[]>();
    for (const l of data.links) {
      const arr = m.get(l.chapterId) ?? [];
      arr.push(l);
      m.set(l.chapterId, arr);
    }
    return m;
  }, [data.links]);

  const entityById = useMemo(
    () => new Map(data.entities.map((e) => [e.id, e])),
    [data.entities]
  );

  const ordered = useMemo(() => {
    const chapters = data.chapters
      .filter((c) => c.level === 'chapter')
      .sort((a, b) => a.no - b.no);
    const rows: {
      c: Chapter;
      isSection: boolean;
      sectionCount: number;
      parentNo: number;
    }[] = [];
    for (const ch of chapters) {
      const secs = sectionsOf.get(ch.id) ?? [];
      rows.push({ c: ch, isSection: false, sectionCount: secs.length, parentNo: 0 });
      if (expanded.has(ch.id)) {
        for (const s of secs) {
          rows.push({ c: s, isSection: true, sectionCount: 0, parentNo: ch.no });
        }
      }
    }
    return rows;
  }, [data.chapters, expanded, sectionsOf]);

  /**
   * 取一行挂的对象。
   * 节 → 只看它自己；章 → 汇总它和它下面所有节（折叠时也能一眼看到全章有谁）。
   * 同一个对象在一行里出现多次（比如埋在一节、收在另一节），合并成一条并保留全部动作。
   */
  const linksFor = (chapterId: string, isSection: boolean): RowLink[] => {
    const ids = isSection
      ? [chapterId]
      : [chapterId, ...(sectionsOf.get(chapterId) ?? []).map((s) => s.id)];

    const order: string[] = [];
    const bucket = new Map<string, Role[]>();

    for (const id of ids) {
      for (const l of linksByChapter.get(id) ?? []) {
        const e = entityById.get(l.entityId);
        if (!e) continue;
        if (!bucket.has(e.id)) {
          bucket.set(e.id, []);
          order.push(e.id);
        }
        const roles = bucket.get(e.id)!;
        if (!roles.includes(l.role)) roles.push(l.role);
      }
    }

    return order.map((id) => ({ entity: entityById.get(id)!, roles: bucket.get(id)! }));
  };

  const addSections = (chapterId: string) => {
    const raw = window.prompt('这一章加几节？', '1');
    if (raw === null) return;
    const n = Math.min(Math.max(Math.floor(Number(raw) || 1), 1), 80);
    for (let i = 0; i < n; i++) {
      dispatch({ type: 'chapter/add', parentId: chapterId });
    }
    setExpanded((prev) => new Set(prev).add(chapterId));
  };

  if (data.chapters.length === 0) {
    return (
      <div className="empty">
        <h3>还没有章节</h3>
        <p>
          先建第一章，再往章下面加节。
          <br />
          不知道从哪下手的话，可以先载入一份填好的示例看看。
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => dispatch({ type: 'chapter/add' })}>
            新建第一章
          </button>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'load', data: makeSampleData() })}
          >
            载入示例
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          人物和钩子挂在<b style={{ color: 'var(--text-2)' }}>节</b>上；章那一行是整章的汇总。
          <span style={{ marginLeft: 10, color: 'var(--text-3)' }}>
            埋 / 提 / 收 / 弃 是钩子的动作，◇ 是这里推进的线。
          </span>
        </div>
        <button className="btn" onClick={() => dispatch({ type: 'chapter/add' })}>
          ＋ 新增章
        </button>
      </div>

      <div className="table-wrap">
        <table className="chapter-table">
          <colgroup>
            <col style={{ width: 96 }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: 140 }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 92 }} />
          </colgroup>
          <thead>
            <tr>
              <th>章 · 节</th>
              <th>标题</th>
              <th>一句话概括</th>
              <th>时间</th>
              <th>结束时什么变了</th>
              <th>出场人物</th>
              <th>钩子 / 道具</th>
              <th>状态</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ c, isSection, sectionCount, parentNo }) => {
              const rowLinks = linksFor(c.id, isSection);
              const chars = rowLinks.filter((x) => x.entity.type === 'character');
              const others = rowLinks.filter((x) => x.entity.type !== 'character');
              const threads = others.filter((x) => x.entity.type === 'thread');

              // 挂在最小的单位上：节永远可以挂；章只有在还没有节的时候才当最小单位
              const canAttach = isSection || sectionCount === 0;

              return (
                <tr key={c.id} className={isSection ? 'row-section' : 'row-chapter'}>
                  <td className="col-no">
                    {isSection ? (
                      <span className="sec-no">
                        {parentNo}.{c.no}
                      </span>
                    ) : (
                      <span className="ch-cell">
                        <button
                          className="tree-toggle"
                          disabled={sectionCount === 0}
                          onClick={() => toggle(c.id)}
                          title={
                            sectionCount === 0
                              ? '还没有节'
                              : expanded.has(c.id)
                                ? '收起这一章'
                                : '展开这一章'
                          }
                        >
                          {expanded.has(c.id) ? '▾' : '▸'}
                        </button>
                        <span className="ch-no">{c.no}</span>
                        {sectionCount > 0 && <span className="sec-count">· {sectionCount} 节</span>}
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      value={c.title}
                      placeholder={isSection ? '节标题' : '章标题'}
                      onChange={(e) =>
                        dispatch({
                          type: 'chapter/update',
                          id: c.id,
                          patch: { title: e.target.value }
                        })
                      }
                      style={isSection ? { fontSize: 14 } : { fontWeight: 600 }}
                    />
                  </td>
                  <td>
                    <textarea
                      className="cell-text"
                      rows={2}
                      value={c.summary}
                      placeholder={isSection ? '这一节发生什么' : '这一章发生什么'}
                      onChange={(e) =>
                        dispatch({
                          type: 'chapter/update',
                          id: c.id,
                          patch: { summary: e.target.value }
                        })
                      }
                    />
                  </td>
                  <td>
                    <div className="time-cell">
                      <input
                        value={c.timeLabel}
                        placeholder={isSection ? '三日后 / 2024-03-05' : '跨度'}
                        onChange={(e) =>
                          dispatch({
                            type: 'chapter/update',
                            id: c.id,
                            patch: { timeLabel: e.target.value }
                          })
                        }
                        style={isSection ? { fontSize: 14 } : undefined}
                      />
                      <select
                        className={`time-kind ${c.timeKind ? `set ${c.timeKind}` : ''}`}
                        value={c.timeKind}
                        title="时间类型：绝对 / 相对"
                        onChange={(e) =>
                          dispatch({
                            type: 'chapter/update',
                            id: c.id,
                            patch: {
                              timeKind: e.target.value as Chapter['timeKind']
                            }
                          })
                        }
                      >
                        <option value="">·</option>
                        <option value="absolute">绝</option>
                        <option value="relative">相</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <textarea
                      className="cell-text"
                      rows={2}
                      value={c.change}
                      placeholder={isSection ? '可留空' : '关系 / 信息 / 处境 / 决心'}
                      onChange={(e) =>
                        dispatch({
                          type: 'chapter/update',
                          id: c.id,
                          patch: { change: e.target.value }
                        })
                      }
                    />
                  </td>
                  <td>
                    <div className="tag-wrap">
                      {chars.map((x) => (
                        <span
                          key={x.entity.id}
                          className={`cchip ${x.entity.layer || 'plain'}`}
                          title={`${x.entity.name}${x.entity.data.identity ? ` · ${x.entity.data.identity}` : ''}`}
                        >
                          {x.entity.name}
                        </span>
                      ))}
                      {canAttach && (
                        <button
                          className="chip-add"
                          title="给这一节挂人物 / 钩子 / 道具 / 线"
                          onClick={() => setPicker(c.id)}
                        >
                          ＋
                        </button>
                      )}
                      {chars.length === 0 && !canAttach && <span className="tag-empty">—</span>}
                    </div>
                  </td>
                  <td>
                    <div className="tag-wrap">
                      {others
                        .filter((x) => x.entity.type !== 'thread')
                        .map((x) => {
                          const r = primaryRole(x.roles);
                          return (
                            <span
                              key={x.entity.id}
                              className={`hchip ${r}`}
                              title={`${x.entity.name} · ${x.roles.map((z) => ROLE_LABEL_FULL[z]).join(' / ')}`}
                            >
                              <b>{x.entity.code || x.entity.name.slice(0, 2)}</b>
                              <i>{x.roles.map((z) => ROLE_SHORT[z]).join('')}</i>
                            </span>
                          );
                        })}
                      {threads.length > 0 && (
                        <span
                          className="hchip thread"
                          title={`这里推进的线：${threads.map((x) => x.entity.name).join('、')}`}
                        >
                          <b>◇ {threads.length}</b>
                        </span>
                      )}
                      {others.length === 0 && <span className="tag-empty">—</span>}
                    </div>
                  </td>
                  <td>
                    <button
                      className={`status-pill ${c.status}`}
                      title="点一下切换：待写 → 在写 → 完成"
                      onClick={() =>
                        dispatch({
                          type: 'chapter/update',
                          id: c.id,
                          patch: {
                            status:
                              c.status === 'todo'
                                ? 'writing'
                                : c.status === 'writing'
                                  ? 'done'
                                  : 'todo'
                          }
                        })
                      }
                    >
                      {STATUS_LABEL[c.status]}
                    </button>
                  </td>
                  <td>
                    <span
                      className={`row-actions ${isSection ? 'always' : ''}`}
                      style={{ display: 'flex' }}
                    >
                      {isSection && (
                        <>
                          <button
                            className="btn ghost tiny move-btn"
                            title="上移"
                            onClick={() =>
                              dispatch({ type: 'chapter/move', id: c.id, dir: -1 })
                            }
                          >
                            ↑
                          </button>
                          <button
                            className="btn ghost tiny move-btn"
                            title="下移"
                            onClick={() =>
                              dispatch({ type: 'chapter/move', id: c.id, dir: 1 })
                            }
                          >
                            ↓
                          </button>
                        </>
                      )}
                      {!isSection && (
                        <button
                          className="btn ghost tiny"
                          title="在这一章下面加节（可一次加多节）"
                          onClick={() => addSections(c.id)}
                        >
                          ＋
                        </button>
                      )}
                      <button
                        className="btn ghost tiny"
                        title="删除"
                        onClick={() => {
                          const childCount = data.chapters.filter(
                            (x) => x.parentId === c.id
                          ).length;
                          const ids = new Set([
                            c.id,
                            ...data.chapters.filter((x) => x.parentId === c.id).map((x) => x.id)
                          ]);
                          const related = data.links.filter((l) => ids.has(l.chapterId)).length;

                          if (childCount > 0 || related > 0) {
                            const msg = [
                              childCount > 0 ? `含 ${childCount} 节` : '',
                              related > 0 ? `挂着 ${related} 条关联` : ''
                            ]
                              .filter(Boolean)
                              .join('，');
                            if (!window.confirm(`${msg}，删除后一并移除，确认？`)) return;
                          }
                          dispatch({ type: 'chapter/remove', id: c.id });
                        }}
                      >
                        ×
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {picker && <ChapterLinkPicker chapterId={picker} onClose={() => setPicker(null)} />}
    </>
  );
}
