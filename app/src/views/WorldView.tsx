import { useMemo, useState } from 'react';
import { useStore } from '../store/store';

const PRESET = ['势力', '地理', '历史', '规则', '种族', '其他'];
const TONES = ['blue', 'green', 'amber', 'purple', 'rose', 'slate'];


export default function WorldView() {
  const { data, dispatch } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  /** 实际用到的分类，按第一次出现的顺序 */
  const cats = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const w of data.world) {
      const c = w.category || '未分类';
      if (!seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    return out;
  }, [data.world]);

  /** 下拉里仍然给全预置分类 */
  const catOptions = useMemo(() => {
    const set = new Set<string>([...PRESET, ...cats]);
    return [...set];
  }, [cats]);

  /** 分类颜色按出现顺序分配：预置顺序在前，自定义的排在后面 */
  const toneMap = useMemo(() => {
    const m = new Map<string, string>();
    cats.forEach((c, i) => m.set(c, TONES[i % TONES.length]));
    m.set('未分类', 'slate');
    return m;
  }, [cats]);

  const toneOf = (cat: string) => toneMap.get(cat) ?? 'slate';

  const groups = useMemo(() => {
    const m = new Map<string, typeof data.world>();
    for (const w of data.world) {
      const key = w.category || '未分类';
      const arr = m.get(key) ?? [];
      arr.push(w);
      m.set(key, arr);
    }
    return [...m.entries()];
  }, [data.world]);

  const active = data.world.find((w) => w.id === activeId) ?? data.world[0];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          世界观不是设定集，是这本书的常识。只写写作时真会用到的。
        </div>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: 'world/add' });
            setActiveId(null);
          }}
        >
          ＋ 新增条目
        </button>
      </div>

      {data.world.length === 0 ? (
        <div className="empty">
          <h3>还没有世界观条目</h3>
          <p>先写三样：这个世界有几股势力、在哪发生、有什么规矩是读者必须知道的。</p>
          <button className="btn primary" onClick={() => dispatch({ type: 'world/add' })}>
            新建第一条
          </button>
        </div>
      ) : (
        <div className="world-split">
          <div className="world-list">
            {groups.map(([cat, items]) => (
              <div key={cat} className="world-group">
                <div className="world-group-head">
                  <span className={`cat-dot ${toneOf(cat)}`} />
                  {cat}
                  <span className="world-group-n">{items.length}</span>
                </div>
                {items.map((w) => (
                  <button
                    key={w.id}
                    className={`world-item ${active?.id === w.id ? 'on' : ''}`}
                    onClick={() => setActiveId(w.id)}
                  >
                    {w.title || '未命名'}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {active && (
            <div className="world-detail">
              <div className="world-detail-head">
                <span className={`cat-badge ${toneOf(active.category || '未分类')}`}>
                  {active.category || '未分类'}
                </span>
                <button
                  className="btn ghost tiny"
                  title="删除这条"
                  onClick={() => {
                    dispatch({ type: 'world/remove', id: active.id });
                    setActiveId(null);
                  }}
                >
                  ×
                </button>
              </div>

              <input
                className="world-title-input"
                value={active.title}
                placeholder="这一条叫什么"
                onChange={(e) =>
                  dispatch({
                    type: 'world/update',
                    id: active.id,
                    patch: { title: e.target.value }
                  })
                }
              />

              <div className="world-meta">
                <label>分类</label>
                <input
                  list="world-cats"
                  value={active.category}
                  placeholder="势力 / 地理 / 规则……"
                  onChange={(e) =>
                    dispatch({
                      type: 'world/update',
                      id: active.id,
                      patch: { category: e.target.value }
                    })
                  }
                />
              </div>

              <textarea
                className="world-body"
                value={active.body}
                placeholder="写清楚这条设定怎么影响故事，而不只是它是什么。"
                onChange={(e) =>
                  dispatch({
                    type: 'world/update',
                    id: active.id,
                    patch: { body: e.target.value }
                  })
                }
              />

              <div className="world-foot">
                一条好的世界观，能回答「它让谁不能做什么」。答不出来的，先别写。
              </div>
            </div>
          )}
        </div>
      )}

      <datalist id="world-cats">
        {catOptions.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}
