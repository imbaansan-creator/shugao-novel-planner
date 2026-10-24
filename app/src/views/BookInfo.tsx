import { useStore } from '../store/store';

export default function BookInfo() {
  const { data, dispatch } = useStore();
  const { book } = data;

  const patch = (p: Partial<typeof book>) =>
    dispatch({ type: 'book/update', patch: p });

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="field">
        <label>书名</label>
        <div className="input-box">
          <input
            value={book.title}
            placeholder="还没想好也可以先空着"
            onChange={(e) => patch({ title: e.target.value })}
            style={{ fontSize: 18, fontWeight: 500, padding: '8px 10px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', gap: 12 }}>
        <div className="field">
          <label>题材</label>
          <div className="input-box">
            <input
              value={book.genre}
              placeholder="武侠 / 悬疑 / 言情 / 科幻"
              onChange={(e) => patch({ genre: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>目标字数</label>
          <div className="input-box">
            <input
              type="number"
              value={book.targetWords || ''}
              placeholder="400000"
              onChange={(e) => patch({ targetWords: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="field">
          <label>章节数</label>
          <div className="input-box">
            <input
              value={data.chapters.filter((c) => c.level === 'chapter').length}
              readOnly
              style={{ color: 'var(--text-3)' }}
            />
          </div>
        </div>
      </div>

      <div className="field">
        <label>一句话故事（讲给别人听，只说一句）</label>
        <div className="input-box">
          <input
            value={book.logline}
            placeholder="一个……的人，因为……，不得不……"
            onChange={(e) => patch({ logline: e.target.value })}
          />
        </div>
        <div className="hint-line">
          这一句里如果没有代价，通常说明故事还没想清楚。
        </div>
      </div>

      <div className="field">
        <label>故事概括</label>
        <div className="input-box">
          <textarea
            value={book.synopsis}
            placeholder="几段话，说清这本书从哪开始、经过什么、到哪结束。"
            onChange={(e) => patch({ synopsis: e.target.value })}
            style={{ minHeight: 180 }}
          />
        </div>
      </div>

      <div className="field">
        <label>想表达什么 / 中心思想</label>
        <div className="input-box">
          <textarea
            value={book.theme}
            placeholder="这本书到底在问什么问题。写不成一句话也不要紧，先记下来。"
            onChange={(e) => patch({ theme: e.target.value })}
            style={{ minHeight: 100 }}
          />
        </div>
        <div className="hint-line">
          中心思想不是主题词，是一个能被追问的问题。
        </div>
      </div>

      <div className="field">
        <label>其他备注</label>
        <div className="input-box">
          <textarea
            value={book.notes}
            placeholder="灵感、参考、想到就记的东西。"
            onChange={(e) => patch({ notes: e.target.value })}
            style={{ minHeight: 90 }}
          />
        </div>
      </div>

      <div className="principle">
        <b>纸面上的书，和写出来的书是两回事。</b>
        <br />
        这一页不用写完。它的作用是：当你写到一半不确定时，回来看看自己当初想说什么。
      </div>
    </div>
  );
}
