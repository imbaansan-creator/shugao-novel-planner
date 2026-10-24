import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/store';
import type { Role, Chapter } from '../domain/types';
import { ROLE_LABEL, TYPE_LABEL, chapterLabel, chapterSortKey } from '../domain/types';
import { ROLE_BY_TYPE, defaultRole } from '../domain/roles';

export default function EntityDrawer({
  entityId,
  onClose
}: {
  entityId: string;
  onClose: () => void;
}) {
  const { data, dispatch } = useStore();
  const entity = data.entities.find((e) => e.id === entityId);
  const [newChapterId, setNewChapterId] = useState('');
  const [newRole, setNewRole] = useState<Role>(() =>
    entity ? defaultRole(entity.type) : 'appear'
  );

  // 切换实体时，把「新关联的动作」重置为该类型的合法值。
  // 之前这里写死 'plant'，导致给人物直接点添加会挂上一个「埋」。
  useEffect(() => {
    if (entity) setNewRole(defaultRole(entity.type));
  }, [entityId, entity?.type]);

  const chapters = useMemo(() => {
    const key = (c: Chapter) => chapterSortKey(c, data.chapters);
    return [...data.chapters].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
    });
  }, [data.chapters]);

  const chapterOf = (id: string): Chapter | undefined => data.chapters.find((c) => c.id === id);

  if (!entity) return null;

  const links = data.links
    .filter((l) => l.entityId === entity.id)
    .map((l) => ({ ...l, chapter: chapterOf(l.chapterId) }))
    .filter((l) => l.chapter)
    .sort((a, b) => {
      const ka = chapterSortKey(a.chapter!, data.chapters);
      const kb = chapterSortKey(b.chapter!, data.chapters);
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
    });

  const patchData = (patch: Record<string, unknown>) =>
    dispatch({
      type: 'entity/update',
      id: entity.id,
      patch: { data: { ...entity.data, ...patch } }
    });

  const roles = ROLE_BY_TYPE[entity.type] ?? ['appear'];

  const hasPlant = links.some((l) => l.role === 'plant');
  const hasPay = links.some((l) => l.role === 'pay');
  const hasDrop = links.some((l) => l.role === 'drop');

  let debtHint: string | null = null;
  let debtTone: 'warn' | 'danger' | 'hint' = 'hint';
  if (entity.type === 'hook' && hasPlant && !hasPay && !hasDrop) {
    debtHint = '这条还没收，算欠债。';
    debtTone = 'warn';
  }
  if (entity.type === 'hook' && hasPay && !hasPlant) {
    debtHint = '收了但没埋过——读者会觉得突然。';
    debtTone = 'danger';
  }
  if (hasDrop) {
    debtHint = '已标记为「弃」，不再计入欠债。';
    debtTone = 'hint';
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="pill">{TYPE_LABEL[entity.type]}</span>
            <span style={{ marginLeft: 8, fontWeight: 500 }}>{entity.name || '未命名'}</span>
          </div>
          <button className="btn ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12 }}>
            <div className="field">
              <label>编号</label>
              <div className="input-box">
                <input
                  value={entity.code}
                  placeholder="H1"
                  onChange={(e) =>
                    dispatch({
                      type: 'entity/update',
                      id: entity.id,
                      patch: { code: e.target.value }
                    })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>名称</label>
              <div className="input-box">
                <input
                  value={entity.name}
                  onChange={(e) =>
                    dispatch({
                      type: 'entity/update',
                      id: entity.id,
                      patch: { name: e.target.value }
                    })
                  }
                />
              </div>
            </div>
          </div>

          {entity.type === 'hook' && (
            <>
              <div className="field">
                <label>读者会问什么（写不成就不是钩子）</label>
                <div className="input-box">
                  <textarea
                    value={entity.data.readerAsk ?? ''}
                    placeholder="例：那把刀最后落在谁手里？"
                    onChange={(e) => patchData({ readerAsk: e.target.value })}
                  />
                </div>
                {entity.data.readerAsk && !/[？?]/.test(entity.data.readerAsk) && (
                  <div className="warn-line">这不像一个问句。钩子的本质是一个未回答的问题。</div>
                )}
              </div>

              <div className="field">
                <label>硬 / 软</label>
                <select
                  value={entity.data.hardness ?? 'hard'}
                  onChange={(e) => patchData({ hardness: e.target.value })}
                  style={{ border: '0.5px solid var(--border)', padding: '6px 8px' }}
                >
                  <option value="hard">硬（必须收）</option>
                  <option value="soft">软（可以不收）</option>
                </select>
              </div>
            </>
          )}

          {entity.type === 'prop' && (
            <>
              <div className="hint-line" style={{ marginBottom: 14 }}>
                道具没有「回收」。它只需要记清楚：长什么样、从哪来、干什么用、现在在谁手里。
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>类型</label>
                  <select
                    value={entity.data.propKind ?? ''}
                    onChange={(e) => patchData({ propKind: e.target.value })}
                    style={{ border: '0.5px solid var(--border)', padding: '6px 8px' }}
                  >
                    <option value="">未分类</option>
                    <option value="信物">信物</option>
                    <option value="武器">武器</option>
                    <option value="器物">器物</option>
                    <option value="药物">药物</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="field">
                  <label>现在在谁手里</label>
                  <div className="input-box">
                    <input
                      value={entity.data.holder ?? ''}
                      placeholder="林诗音"
                      onChange={(e) => patchData({ holder: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label>外观（读者靠这个记住它）</label>
                <div className="input-box">
                  <textarea
                    value={entity.data.appearance ?? ''}
                    placeholder="旧银，钗头是一朵断了一瓣的梅"
                    onChange={(e) => patchData({ appearance: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>来历</label>
                <div className="input-box">
                  <textarea
                    value={entity.data.origin ?? ''}
                    placeholder="谁做的 / 谁给的 / 从哪捡的"
                    onChange={(e) => patchData({ origin: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>作用</label>
                <div className="input-box">
                  <textarea
                    value={entity.data.function ?? ''}
                    placeholder="它在故事里承担什么：认亲的信物 / 杀人的凶器 / 打开某处的钥匙"
                    onChange={(e) => patchData({ function: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {entity.type === 'character' && (
            <>
              <div className="field">
                <label>别名（同一个人在书里被叫过的其他称呼）</label>
                <div className="input-box">
                  <input
                    value={(entity.data.aliases ?? []).join('、')}
                    placeholder="小李探花、李探花、探花郎"
                    onChange={(e) =>
                      patchData({
                        aliases: e.target.value
                          .split(/[、,，\s]+/)
                          .map((x) => x.trim())
                          .filter(Boolean)
                      })
                    }
                  />
                </div>
                <div className="hint-line">
                  用顿号或逗号分隔。别名不统一，检索会漏——「陆爷」和「陆小凤」会被当成两个人。
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>性别</label>
                  <select
                    value={entity.data.gender ?? ''}
                    onChange={(e) => patchData({ gender: e.target.value })}
                    style={{ border: '0.5px solid var(--border)', padding: '6px 8px' }}
                  >
                    <option value="">未定</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="field">
                  <label>年龄</label>
                  <div className="input-box">
                    <input
                      value={entity.data.age ?? ''}
                      placeholder="28 / 二十出头 / 不详"
                      onChange={(e) => patchData({ age: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label>身份 / 职业</label>
                <div className="input-box">
                  <input
                    value={entity.data.identity ?? ''}
                    placeholder="说书人的孙女 / 金钱帮帮主"
                    onChange={(e) => patchData({ identity: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>性格</label>
                <div className="input-box">
                  <textarea
                    value={entity.data.personality ?? ''}
                    placeholder="写行为倾向，别写形容词。"
                    onChange={(e) => patchData({ personality: e.target.value })}
                  />
                </div>
                <div className="hint-line">
                  「宁可自己吃亏也不说假话」比「诚实」有用——前者能写进情节，后者不能。
                </div>
              </div>

              <div className="field">
                <label>外貌 / 记忆点</label>
                <div className="input-box">
                  <input
                    value={entity.data.appearance ?? ''}
                    placeholder="读者靠这个认人：左手的刀疤、总穿白衣、说话带口音"
                    onChange={(e) => patchData({ appearance: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>据点（他常在的地方）</label>
                <div className="input-box">
                  <input
                    value={entity.data.base ?? ''}
                    placeholder="百花楼 / 无"
                    onChange={(e) => patchData({ base: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>绝不会为主角做的事</label>
                <div className="input-box">
                  <input
                    value={entity.data.never ?? ''}
                    placeholder="这一条决定了他和主角之间的边界"
                    onChange={(e) => patchData({ never: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 22, marginBottom: 10, fontSize: 12, color: 'var(--text-3)' }}>
            挂在哪些章节
          </div>

          <div className="table-wrap">
            <table>
              <colgroup>
                <col style={{ width: 80 }} />
                <col style={{ width: 80 }} />
                <col />
                <col style={{ width: 36 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>章</th>
                  <th>动作</th>
                  <th>章节标题</th>
                  <th />
                </tr>
              </thead>
              <tbody className="link-table">
                {links.length === 0 && (
                  <tr>
                    <td colSpan={4} className="quiet">
                      还没挂到任何章节。
                    </td>
                  </tr>
                )}
                {links.map((l) => (
                  <tr key={l.id}>
                    <td className="num">{chapterLabel(l.chapter!, data.chapters)}</td>
                    <td>
                      <span
                        className={`pill ${
                          l.role === 'pay' ? 'done' : l.role === 'plant' ? 'mid' : ''
                        }`}
                      >
                        {ROLE_LABEL[l.role]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{l.chapter!.title || '—'}</td>
                    <td>
                      <button
                        className="btn ghost tiny"
                        onClick={() => dispatch({ type: 'link/remove', id: l.id })}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {debtHint && (
            <div className={debtTone === 'danger' ? 'danger-line' : debtTone === 'warn' ? 'warn-line' : 'hint-line'}>
              {debtHint}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <select
              value={newChapterId}
              onChange={(e) => setNewChapterId(e.target.value)}
              style={{ border: '0.5px solid var(--border)', padding: '5px 8px', flex: 1 }}
            >
              <option value="">选择章节…</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {chapterLabel(c, data.chapters)}
                  {c.title ? ` · ${c.title}` : ''}
                </option>
              ))}
            </select>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              style={{ border: '0.5px solid var(--border)', padding: '5px 8px', width: 90 }}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <button
              className="btn"
              disabled={!newChapterId}
              onClick={() => {
                if (!newChapterId) return;
                dispatch({
                  type: 'link/add',
                  entityId: entity.id,
                  chapterId: newChapterId,
                  role: newRole
                });
                setNewChapterId('');
              }}
            >
              添加
            </button>
          </div>

          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '0.5px solid var(--border)' }}>
            <button
              className="btn ghost"
              style={{ color: 'var(--danger)' }}
              onClick={() => {
                if (window.confirm(`删除「${entity.name}」及其所有关联？`)) {
                  dispatch({ type: 'entity/remove', id: entity.id });
                  onClose();
                }
              }}
            >
              删除这个{TYPE_LABEL[entity.type]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
