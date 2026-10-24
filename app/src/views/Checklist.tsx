import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { QUESTIONS, STAGES, STATE_LABEL, STATE_ORDER, questionStats, type StageId } from '../domain/questions';
import type { AnswerState } from '../domain/types';

type Filter = 'all' | 'blank' | 'pending';

export default function Checklist({ onJump }: { onJump: (view: string) => void }) {
  const { data, dispatch } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Set<StageId>>(() => new Set<StageId>(['spine']));
  const seeded = useRef(false);

  const stats = useMemo(() => questionStats(data.answers), [data.answers]);

  const answerOf = (id: string) => data.answers.find((a) => a.questionId === id);

  // 已经答过的阶段自动展开，省得每次回来都要点
  useEffect(() => {
    if (seeded.current || data.answers.length === 0) return;
    seeded.current = true;
    const withAnswers = new Set<StageId>(['spine']);
    for (const a of data.answers) {
      const st = QUESTIONS.find((q) => q.id === a.questionId)?.stage;
      if (st) withAnswers.add(st);
    }
    setOpen(withAnswers);
  }, [data.answers]);

  const setState = (questionId: string, state: AnswerState) => {
    dispatch({ type: 'answer/set', questionId, patch: { state } });
  };

  const setText = (questionId: string, text: string) => {
    const current = answerOf(questionId);
    // 一动手写，就从「未答」变「有想法」；已经是别的状态就不动
    const state = !current || current.state === 'blank' ? 'draft' : current.state;
    dispatch({ type: 'answer/set', questionId, patch: { text, state } });
  };

  const visible = (state: AnswerState) => {
    if (filter === 'all') return true;
    if (filter === 'blank') return state === 'blank';
    return state === 'pending';
  };

  const pct = (n: number) => `${(n / stats.total) * 100}%`;

  return (
    <>
      <div className="cl-head">
        <div>
          <h2>开工前该想清楚的事</h2>
          <p>
            这些答案不会自动变成章节。它们只是把脑子里的东西摆到桌面上——
            <b>答不上来的那一条，就是将来会塌的地方。</b>
          </p>
        </div>
        <div className="cl-count">
          <b>{stats.blank}</b>
          <span>条还没答</span>
        </div>
      </div>

      <div className="cl-bar" title={`共 ${stats.total} 条`}>
        {STATE_ORDER.map((s) =>
          stats[s] > 0 ? <span key={s} className={`cl-seg ${s}`} style={{ width: pct(stats[s]) }} /> : null
        )}
      </div>

      <div className="cl-legend">
        {STATE_ORDER.map((s) => (
          <span key={s} className={`cl-legend-item ${s}`}>
            <i />
            {STATE_LABEL[s]} {stats[s]}
          </span>
        ))}
      </div>

      <div className="filter-row" style={{ marginTop: 14 }}>
        {(
          [
            ['all', `全部 ${stats.total}`],
            ['blank', `未答 ${stats.blank}`],
            ['pending', `待验证 ${stats.pending}`]
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            className={`chip ${filter === k ? 'on' : ''}`}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {STAGES.map((stage) => {
        const qs = QUESTIONS.filter((q) => q.stage === stage.id);
        const rows = qs.filter((q) => visible(answerOf(q.id)?.state ?? 'blank'));
        if (rows.length === 0) return null;

        const done = qs.filter((q) => {
          const st = answerOf(q.id)?.state ?? 'blank';
          return st === 'confirmed' || st === 'na';
        }).length;

        // 筛选时强制展开，否则过滤出来的题被折叠着，看起来像没有结果
        const isOpen = filter !== 'all' || open.has(stage.id);

        return (
          <div className="cl-stage" key={stage.id}>
            <button
              className="cl-stage-head"
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(stage.id)) next.delete(stage.id);
                  else next.add(stage.id);
                  return next;
                })
              }
            >
              <span className="cl-arrow">{isOpen ? '▾' : '▸'}</span>
              <span className="cl-stage-name">{stage.name}</span>
              <span className="cl-stage-when">{stage.when}</span>
              <span className="cl-stage-desc">{stage.desc}</span>
              <span className={`cl-stage-n ${done === qs.length ? 'all' : ''}`}>
                {done}/{qs.length}
              </span>
            </button>

            {isOpen && (
              <div className="cl-list">
                {rows.map((q) => {
                  const a = answerOf(q.id);
                  const state: AnswerState = a?.state ?? 'blank';
                  const idx = QUESTIONS.findIndex((x) => x.id === q.id) + 1;

                  return (
                    <div className={`cl-item ${state}`} key={q.id}>
                      <div className="cl-q">
                        <span className="cl-no">{String(idx).padStart(2, '0')}</span>
                        <div>
                          <div className="cl-text">{q.text}</div>
                          {q.hint && <div className="cl-hint">{q.hint}</div>}
                          {q.action && (
                            <button className="cl-jump" onClick={() => onJump(q.action!.view)}>
                              {q.action.label} →
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        className="cl-answer"
                        rows={2}
                        value={a?.text ?? ''}
                        placeholder="写在这里。答不上来就空着——空着比编一个强。"
                        onChange={(e) => setText(q.id, e.target.value)}
                      />

                      <div className="cl-states">
                        {STATE_ORDER.map((s) => (
                          <button
                            key={s}
                            className={`cl-state ${s} ${state === s ? 'on' : ''}`}
                            onClick={() => setState(q.id, s)}
                          >
                            {STATE_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="cl-foot">
        「已确认」的意思是：这条你写进正文、并且验证过了。
        <br />
        「待验证」是好状态——它比「已确认」诚实，因为它承认你还没写到那儿。
      </div>
    </>
  );
}
