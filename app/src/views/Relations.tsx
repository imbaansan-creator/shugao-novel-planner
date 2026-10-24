import { useMemo } from 'react';
import { useStore } from '../store/store';

const LABEL_HINTS = ['朋友', '师徒', '夫妻', '父子', '兄弟', '主仆', '仇敌', '旧情', '盟友', '镜像'];

export default function Relations() {
  const { data, dispatch } = useStore();

  const chars = useMemo(
    () => data.entities.filter((e) => e.type === 'character'),
    [data.entities]
  );

  const chapters = useMemo(
    () =>
      data.chapters
        .filter((c) => c.level === 'chapter')
        .sort((a, b) => a.no - b.no),
    [data.chapters]
  );

  const nameOf = (id: string) => chars.find((c) => c.id === id)?.name ?? '—';

  if (chars.length < 2) {
    return (
      <div className="empty">
        <h3>先有两个人，才有关系</h3>
        <p>人物页至少要有两个角色，才能在这里连一条边。</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          只记<b style={{ color: 'var(--text-2)' }}>会变</b>的关系。不变的关系不会产生任何动作，记下来也只是装饰。
        </div>
        <button className="btn" onClick={() => dispatch({ type: 'relation/add' })}>
          ＋ 新建关系
        </button>
      </div>

      {data.relations.length === 0 ? (
        <div className="empty">
          <h3>还没有关系</h3>
          <p>
            一条关系只要四个字段：谁和谁、是什么关系、从什么变成什么、在哪一章变的。
            <br />
            最后那个字段是重点——没有它，「从敌到友」就只是设定，不是情节。
          </p>
          <button className="btn primary" onClick={() => dispatch({ type: 'relation/add' })}>
            新建第一条
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="rel-table">
            <colgroup>
              <col style={{ width: 158 }} />
              <col style={{ width: 158 }} />
              <col style={{ width: 124 }} />
              <col />
              <col style={{ width: 26 }} />
              <col />
              <col style={{ width: 190 }} />
              <col style={{ width: 38 }} />
            </colgroup>
            <thead>
              <tr>
                <th>一方</th>
                <th>另一方</th>
                <th>关系</th>
                <th>起始状态</th>
                <th />
                <th>结束状态</th>
                <th>在哪一章变</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.relations.map((r) => {
                const changed =
                  r.from.trim() !== '' && r.to.trim() !== '' && r.from.trim() !== r.to.trim();
                const missing = changed && !r.changedAt;

                return (
                  <tr key={r.id} className={missing ? 'rel-row-warn' : undefined}>
                    <td>
                      <select
                        className="rel-select"
                        value={r.aId}
                        onChange={(e) =>
                          dispatch({
                            type: 'relation/update',
                            id: r.id,
                            patch: { aId: e.target.value }
                          })
                        }
                      >
                        <option value="">选一个人</option>
                        {chars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="rel-select"
                        value={r.bId}
                        onChange={(e) =>
                          dispatch({
                            type: 'relation/update',
                            id: r.id,
                            patch: { bId: e.target.value }
                          })
                        }
                      >
                        <option value="">选一个人</option>
                        {chars.map((c) => (
                          <option key={c.id} value={c.id} disabled={c.id === r.aId}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        list="rel-labels"
                        value={r.label}
                        placeholder="朋友 / 仇敌"
                        onChange={(e) =>
                          dispatch({
                            type: 'relation/update',
                            id: r.id,
                            patch: { label: e.target.value }
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={r.from}
                        placeholder="起始：恩人"
                        onChange={(e) =>
                          dispatch({
                            type: 'relation/update',
                            id: r.id,
                            patch: { from: e.target.value }
                          })
                        }
                      />
                    </td>
                    <td className="rel-arrow">→</td>
                    <td>
                      <input
                        value={r.to}
                        placeholder="结束：反目"
                        onChange={(e) =>
                          dispatch({
                            type: 'relation/update',
                            id: r.id,
                            patch: { to: e.target.value }
                          })
                        }
                      />
                    </td>
                    <td>
                      <div className="rel-chapter">
                        <select
                          className={`rel-select ${missing ? 'warn' : ''}`}
                          value={r.changedAt ?? ''}
                          onChange={(e) =>
                            dispatch({
                              type: 'relation/update',
                              id: r.id,
                              patch: { changedAt: e.target.value || null }
                            })
                          }
                        >
                          <option value="">{missing ? '缺转折' : '没变'}</option>
                          {chapters.map((c) => (
                            <option key={c.id} value={c.id}>
                              第 {c.no} 章 {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn ghost tiny row-actions"
                        title="删掉这条关系"
                        onClick={() => {
                          if (
                            window.confirm(
                              `删掉「${nameOf(r.aId)} — ${nameOf(r.bId)}」这条关系？`
                            )
                          ) {
                            dispatch({ type: 'relation/remove', id: r.id });
                          }
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rel-foot">
        关系是两个人之间的事，所以它有「起点」和「终点」；写不出终点，说明它本来就不会变。
      </div>

      <datalist id="rel-labels">
        {LABEL_HINTS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
    </>
  );
}
