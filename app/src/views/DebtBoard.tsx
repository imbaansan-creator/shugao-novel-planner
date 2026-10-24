import { useStore } from '../store/store';
import { chapterLabel } from '../domain/types';

export default function DebtBoard() {
  const { data, report, dispatch } = useStore();

  // D1：0 数据 与 0 问题，必须长得不一样
  if (data.chapters.length === 0) {
    return (
      <div className="empty">
        <h3>还没有数据</h3>
        <p>先建章节和钩子。这份体检现在没有可检查的内容。</p>
      </div>
    );
  }

  if (data.links.length === 0) {
    return (
      <div className="empty">
        <h3>有 {data.chapters.length} 章，但都还没标注</h3>
        <p>
          体检只认你自己打的标签。没有标签，它不知道该检查什么——这不是「没问题」，
          而是「没录」。
        </p>
      </div>
    );
  }

  const ackTargetExists = (id: string) =>
    data.entities.some((e) => e.id === id) || data.relations.some((r) => r.id === id);

  const ackCount = data.acks.filter((a) => ackTargetExists(a.entityId)).length;

  const totalIssues = report.results.reduce((s, r) => s + r.issues.length, 0);

  const chapterCount = data.chapters.filter((c) => c.level === 'chapter').length;
  const sectionCount = data.chapters.length - chapterCount;

  return (
    <>
      <div className="scanbar">
        <strong>{report.totalScanned}</strong>
        条参与检查 ·
        <span>{report.entityCount} 个可检查对象</span>·
        <span>
          {chapterCount} 章{sectionCount > 0 ? ` ${sectionCount} 节` : ''}
        </span>
        ·<span>{data.links.length} 条关联</span>
        {ackCount > 0 && <span>· 已确认不改 {ackCount} 条</span>}
      </div>

      <div className="debt-total">
        {totalIssues === 0 ? '四类检查都跑过了，没有报出问题' : `共 ${totalIssues} 条要看的`}
      </div>

      {report.results.map((r) => (
        <div className="section" key={r.checkId}>
          <div className="section-head">
            <h3>{r.title}</h3>
            <span className="n">
              {r.issues.length} 条 · 扫了 {r.scanned} 条
            </span>
          </div>
          <div className="issue-list">
            {r.issues.length === 0 ? (
              <div className="quiet">
                {r.scanned === 0
                  ? '没有可检查的数据——这不等于没有问题，是这一类还没录。'
                  : `扫了 ${r.scanned} 条，没有发现问题。`}
              </div>
            ) : (
              r.issues.map((it) => (
                <div className="issue-row" key={`${it.checkId}-${it.entityId}`}>
                  <div className={`issue-mark ${it.severity}`}>
                    {it.severity === 'high' ? '!' : '·'}
                  </div>
                  <div className="issue-text">
                    <div className="reason">{it.reason}</div>
                    <div className="hint">
                      {it.checkId === 'C1' ? '处理：补收 / 加提 / 标弃' : ''}
                      {it.checkId === 'C2' ? '处理：补埋，或者删掉这次收' : ''}
                      {it.checkId === 'C3' ? '处理：中间加一次提醒' : ''}
                      {it.checkId === 'C4' ? '处理：推进一下这条线' : ''}
                      {it.checkId === 'C5' ? '处理：补上变化的那一章，或者把状态改成没变' : ''}
                    </div>
                  </div>
                  <div className="issue-actions">
                    <button
                      className="btn tiny"
                      onClick={() =>
                        dispatch({
                          type: 'ack/toggle',
                          entityId: it.entityId,
                          checkId: it.checkId
                        })
                      }
                    >
                      看了，不改
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {report.unmarked.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h3>未标注</h3>
            <span className="n">{report.unmarked.length} 处</span>
          </div>
          <div className="issue-list">
            <div className="quiet">
              {report.unmarked.map((c) => chapterLabel(c, data.chapters)).join('　')}
              <div style={{ marginTop: 4 }}>
                这些章节没有任何关联。它们可能不需要埋钩子，也可能只是你还没想起来。
              </div>
            </div>
          </div>
        </div>
      )}

      {ackCount > 0 && (
        <div className="section">
          <div className="section-head">
            <h3>已确认不改</h3>
            <span className="n">{ackCount} 条</span>
          </div>
          <div className="issue-list">
            {data.acks
              .filter((a) => ackTargetExists(a.entityId))
              .map((a) => {
                const e =
                  data.entities.find((x) => x.id === a.entityId) ??
                  data.relations.find((x) => x.id === a.entityId)!;
                return (
                  <div className="issue-row" key={`${a.entityId}-${a.checkId}`}>
                    <div className="issue-mark" style={{ color: 'var(--text-3)' }}>
                      ✓
                    </div>
                    <div className="issue-text">
                      <div className="reason" style={{ color: 'var(--text-2)' }}>
                        {'name' in e ? e.name : `${e.aId} — ${e.bId}`} · {a.checkId}
                      </div>
                      <div className="hint">已确认不需要处理</div>
                    </div>
                    <div className="issue-actions">
                      <button
                        className="btn tiny"
                        onClick={() =>
                          dispatch({
                            type: 'ack/toggle',
                            entityId: a.entityId,
                            checkId: a.checkId
                          })
                        }
                      >
                        撤销
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}
