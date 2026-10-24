import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import type { EntityType, Role } from '../domain/types';
import { TYPE_LABEL, normalizeChapterNo } from '../domain/types';
import EntityDrawer from '../components/EntityDrawer';

export default function EntityList({ type }: { type: EntityType }) {
  const { data, dispatch } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => data.entities.filter((e) => e.type === type), [data.entities, type]);

  const chapterOf = (chapterId: string): number => {
    const c = data.chapters.find((x) => x.id === chapterId);
    return c ? normalizeChapterNo(c, data.chapters) : 0;
  };

  /** 一个对象出现过的章号（去重、升序）；传 roles 就只看那几种动作 */
  const nosOf = (entityId: string, roles?: Role[]): number[] => {
    const set = new Set<number>();
    for (const l of data.links) {
      if (l.entityId !== entityId) continue;
      if (roles && !roles.includes(l.role)) continue;
      const n = chapterOf(l.chapterId);
      if (n > 0) set.add(n);
    }
    return [...set].sort((a, b) => a - b);
  };

  /** 全书章号，用来画「出场条」 */
  const allNos = useMemo(
    () =>
      data.chapters
        .filter((c) => c.level === 'chapter')
        .map((c) => c.no)
        .sort((a, b) => a - b),
    [data.chapters]
  );

  const hint =
    type === 'character'
      ? '点一行打开详情。这里只记四件事：他是谁、在哪、底线是什么、出现在哪几章。'
      : type === 'thread'
        ? '点一行打开详情，标出这条线推进过的章节。'
        : type === 'prop'
          ? '道具有物理形态，会易手，所以多一个「现在在谁手里」。'
          : '钩子要能写成一个读者会追问的问句。写不出来的，就不是钩子。';

  if (rows.length === 0) {
    return (
      <div className="empty">
        <h3>还没有{TYPE_LABEL[type]}</h3>
        <p>
          {type === 'hook'
            ? '钩子要挂在一个具体东西上，并且能写成一个读者会追问的问句。'
            : type === 'prop'
              ? '道具有物理形态，会易手，所以多一个「现在在谁手里」。'
              : '先建几个，再挂到章节上。'}
        </p>
        <button
          className="btn primary"
          onClick={() => dispatch({ type: 'entity/add', entityType: type })}
        >
          新建一个
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>{hint}</div>
        <button className="btn" onClick={() => dispatch({ type: 'entity/add', entityType: type })}>
          ＋ 新建{TYPE_LABEL[type]}
        </button>
      </div>

      <div className="table-wrap">
        <table className="entity-table">
          {type === 'character' && (
            <colgroup>
              <col style={{ width: 232 }} />
              <col style={{ width: 258 }} />
              <col style={{ width: 92 }} />
              <col />
              <col style={{ width: 176 }} />
              <col style={{ width: 38 }} />
            </colgroup>
          )}
          {type === 'hook' && (
            <colgroup>
              <col style={{ width: 62 }} />
              <col />
              <col style={{ width: 68 }} />
              <col style={{ width: 300 }} />
              <col style={{ width: 82 }} />
              <col style={{ width: 38 }} />
            </colgroup>
          )}
          {type === 'prop' && (
            <colgroup>
              <col style={{ width: 62 }} />
              <col style={{ width: 220 }} />
              <col />
              <col style={{ width: 96 }} />
              <col style={{ width: 38 }} />
            </colgroup>
          )}
          {type === 'thread' && (
            <colgroup>
              <col style={{ width: 230 }} />
              <col />
              <col style={{ width: 96 }} />
              <col style={{ width: 38 }} />
            </colgroup>
          )}

          <thead>
            {type === 'character' ? (
              <tr>
                <th>名称 / 别名</th>
                <th>身份 / 据点</th>
                <th>性别 · 年龄</th>
                <th>绝不会为主角做的事</th>
                <th>出场分布</th>
                <th />
              </tr>
            ) : type === 'hook' ? (
              <tr>
                <th>编号</th>
                <th>钩子 / 读者会问什么</th>
                <th>硬软</th>
                <th>埋 → 提 → 收</th>
                <th>状态</th>
                <th />
              </tr>
            ) : type === 'prop' ? (
              <tr>
                <th>编号</th>
                <th>名称 / 外观</th>
                <th>类型 / 持有者</th>
                <th>出现</th>
                <th />
              </tr>
            ) : (
              <tr>
                <th>名称</th>
                <th>推进过的章节</th>
                <th>推进</th>
                <th />
              </tr>
            )}
          </thead>

          <tbody>
            {rows.map((e) => {
              const removeBtn = (
                <td>
                  <button
                    className="btn ghost tiny row-actions"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      const n = data.links.filter((l) => l.entityId === e.id).length;
                      const rn = data.relations.filter(
                        (r) => r.aId === e.id || r.bId === e.id
                      ).length;
                      const extra = [
                        n > 0 ? `${n} 条章节关联` : '',
                        rn > 0 ? `${rn} 条关系` : ''
                      ]
                        .filter(Boolean)
                        .join('、');
                      const msg = extra
                        ? `删掉「${e.name}」？它的 ${extra} 会一起消失。`
                        : `删掉「${e.name}」？`;
                      if (window.confirm(msg)) dispatch({ type: 'entity/remove', id: e.id });
                    }}
                  >
                    ×
                  </button>
                </td>
              );

              if (type === 'character') {
                const nos = nosOf(e.id);
                const aliases = e.data.aliases ?? [];
                return (
                  <tr key={e.id} onClick={() => setSelected(e.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="ent-name">
                        {e.name}
                        {e.layer === 'core' && <span className="lead-tag">主</span>}
                      </div>
                      {aliases.length > 0 && (
                        <div className="ent-sub">{aliases.join(' · ')}</div>
                      )}
                    </td>
                    <td>
                      <div className="ent-mid">{e.data.identity || '—'}</div>
                      <div className="ent-sub">据点 · {e.data.base || '未定'}</div>
                    </td>
                    <td>
                      <div className="ent-mid">{e.data.gender || '—'}</div>
                      {e.data.age && <div className="ent-sub">{e.data.age}</div>}
                    </td>
                    <td className={e.data.never ? 'ent-never' : 'ent-mid'}>
                      {e.data.never || '—'}
                    </td>
                    <td>
                      {allNos.length <= 24 ? (
                        <div className="presence">
                          {allNos.map((n) => {
                            const on = nos.includes(n);
                            return (
                              <span
                                key={n}
                                className={`pdot ${on ? `on ${e.layer || 'plain'}` : ''}`}
                                title={`第 ${n} 章`}
                              />
                            );
                          })}
                        </div>
                      ) : null}
                      <div className="presence-n">
                        {nos.length} / {allNos.length} 章
                      </div>
                    </td>
                    {removeBtn}
                  </tr>
                );
              }

              if (type === 'hook') {
                const plantNos = nosOf(e.id, ['plant']);
                const hintNos = nosOf(e.id, ['hint']);
                const payNos = nosOf(e.id, ['pay']);
                const dropNos = nosOf(e.id, ['drop']);
                const closed = payNos.length > 0;
                const dropped = dropNos.length > 0;
                const state = dropped
                  ? { key: 'drop', label: '已弃' }
                  : closed
                    ? { key: 'pay', label: '已收' }
                    : plantNos.length > 0
                      ? { key: 'open', label: '悬空' }
                      : { key: 'none', label: '未埋' };

                return (
                  <tr key={e.id} onClick={() => setSelected(e.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="code-chip">{e.code || '—'}</span>
                    </td>
                    <td>
                      <div className="ent-name">{e.name}</div>
                      {e.data.readerAsk && <div className="ent-sub">{e.data.readerAsk}</div>}
                    </td>
                    <td>
                      <span
                        className={`hard-chip ${e.data.hardness === 'soft' ? 'soft' : 'hard'}`}
                      >
                        {e.data.hardness === 'soft' ? '软' : '硬'}
                      </span>
                    </td>
                    <td>
                      <div className="chain">
                        <span className="chain-node plant">
                          埋 {plantNos.length ? plantNos.join('/') : '—'}
                        </span>
                        <span className="chain-arrow">→</span>
                        <span className="chain-node hint">
                          提 {hintNos.length ? hintNos.join('/') : '—'}
                        </span>
                        <span className="chain-arrow">→</span>
                        <span
                          className={`chain-node ${dropped ? 'drop' : closed ? 'pay' : 'open'}`}
                        >
                          {dropped
                            ? `弃 ${dropNos.join('/')}`
                            : closed
                              ? `收 ${payNos.join('/')}`
                              : '未收'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`state-chip ${state.key}`}>{state.label}</span>
                    </td>
                    {removeBtn}
                  </tr>
                );
              }

              const nos = nosOf(e.id);
              return (
                <tr key={e.id} onClick={() => setSelected(e.id)} style={{ cursor: 'pointer' }}>
                  {type === 'prop' ? (
                    <>
                      <td>
                        <span className="code-chip">{e.code || '—'}</span>
                      </td>
                      <td>
                        <div className="ent-name">{e.name}</div>
                        {e.data.appearance && <div className="ent-sub">{e.data.appearance}</div>}
                      </td>
                      <td className="ent-mid">
                        {[e.data.propKind, e.data.holder].filter(Boolean).join(' · ') || '—'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <div className="ent-name">{e.name}</div>
                      </td>
                      <td className="ent-mid">
                        {nos.length ? nos.map((n) => `第 ${n} 章`).join('、') : '—'}
                      </td>
                    </>
                  )}
                  <td>
                    <span className="count-chip">{nos.length} 章</span>
                  </td>
                  {removeBtn}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <EntityDrawer entityId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
