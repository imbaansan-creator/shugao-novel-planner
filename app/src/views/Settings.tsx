import { useState } from 'react';
import { useStore, makeSampleData, emptyData } from '../store/store';

export default function SettingsView() {
  const { data, dispatch, fileName, canBindFile, bindFile, unbindFile, snapshots, saveSnapshot, restoreSnapshot } =
    useStore();

  const [scale, setScale] = useState<string>(
    () => localStorage.getItem('np-font-scale') ?? '1.2'
  );

  const applyScale = (v: string) => {
    setScale(v);
    localStorage.setItem('np-font-scale', v);
    document.documentElement.style.setProperty('--fs', v);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.book.title || '书稿'}_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="settings-row">
        <div>
          <div className="label">界面字号</div>
          <div className="note">
            2K 屏如果不缩放，用「标准」或「大」。整页会跟着变，包括表格和输入框。
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['1', '紧凑'],
            ['1.2', '标准'],
            ['1.4', '大'],
            ['1.6', '特大']
          ].map(([v, label]) => (
            <button
              key={v}
              className={`btn ${scale === v ? 'primary' : ''}`}
              onClick={() => applyScale(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="label">提醒间隔（C3）</div>
          <div className="note">钩子埋下后多少章没提，就提醒一次</div>
        </div>
        <input
          type="number"
          min={1}
          value={data.settings.c3Interval}
          onChange={(e) =>
            dispatch({
              type: 'settings/update',
              patch: { c3Interval: Math.max(1, Number(e.target.value) || 1) }
            })
          }
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="label">断线阈值（C4）</div>
          <div className="note">一条线多少章没有推进，就提醒一次</div>
        </div>
        <input
          type="number"
          min={1}
          value={data.settings.c4Stale}
          onChange={(e) =>
            dispatch({
              type: 'settings/update',
              patch: { c4Stale: Math.max(1, Number(e.target.value) || 1) }
            })
          }
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="label">本地文件</div>
          <div className="note">
            绑定一个 .json 文件后，每次改动自动写进去。文件可以直接复制备份、换电脑带走。
            {!canBindFile && ' 当前是双击打开的本地文件，浏览器不给写入权限，用下方「导出 JSON」备份。'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {fileName ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--ok)' }}>● {fileName}</span>
              <button className="btn" onClick={() => void unbindFile()}>
                解绑
              </button>
            </>
          ) : (
            <button
              className="btn primary"
              disabled={!canBindFile}
              onClick={() => void bindFile()}
            >
              {canBindFile ? '绑定文件' : '当前环境不支持'}
            </button>
          )}
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="label">保存位置</div>
          <div className="note">
            存在浏览器本地，按「源」隔离。localhost 和 127.0.0.1 是两套数据。
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-3)',
            fontFamily: 'ui-monospace, Consolas, monospace',
            lineHeight: 1.7
          }}
        >
          {location.origin}
          <br />
          localStorage · novel-planner:v1
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="label">数据</div>
          <div className="note">导出为 JSON 存档；换浏览器或换设备时用导入还原</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportJson}>
            导出 JSON
          </button>
          <button
            className="btn"
            onClick={() => document.getElementById('import-file')?.click()}
          >
            导入 JSON
          </button>
          <input
            id="import-file"
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(String(reader.result));
                  const candidate =
                    parsed.data && parsed.data.book
                      ? parsed.data
                      : parsed.book
                        ? parsed
                        : null;
                  if (!candidate) throw new Error('bad shape');
                  if (!window.confirm('导入会覆盖当前数据，确认？')) return;
                  dispatch({ type: 'load', data: candidate });
                } catch {
                  window.alert('这个文件读不出来，确认是不是本工具导出的 JSON。');
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
          <button
            className="btn"
            onClick={() => {
              if (window.confirm('载入《多情剑客无情剑》示例会覆盖当前数据，确认？')) {
                dispatch({ type: 'load', data: makeSampleData() });
              }
            }}
          >
            载入《多情剑客无情剑》
          </button>
          <button
            className="btn"
            onClick={() => {
              if (window.confirm('清空所有数据？此操作不可撤销。')) {
                dispatch({ type: 'load', data: emptyData() });
              }
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="label">自动快照</div>
          <div className="note">
            打开时存一版，之后每十分钟一版，最多留 {6} 版。快照不含地图底图（图太大，会吃光存储）。
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={saveSnapshot}>
            立即存一版
          </button>
        </div>
      </div>

      {snapshots.length > 0 && (
        <div className="snap-list">
          {[...snapshots].reverse().map((s, i) => (
            <div className="snap-row" key={s.at}>
              <span className="snap-time">
                {new Date(s.at).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className="snap-meta">
                {s.data.chapters.filter((c) => c.level === 'chapter').length} 章 ·{' '}
                {s.data.entities.length} 个对象 · {s.data.links.length} 条关联
              </span>
              {i === 0 && <span className="snap-tag">最近</span>}
              <button
                className="btn tiny"
                onClick={() => {
                  if (window.confirm('恢复这一版会覆盖当前数据（可以再撤销一次），确认？')) {
                    restoreSnapshot(s.at);
                  }
                }}
              >
                恢复
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="principle">
        <b>这个工具只做一件事：记账，不判断。</b>
        <br />
        它不知道你写得好不好，也不读正文。它只数五件事：埋了有没有收、收了有没有埋、
        埋了多久没提、线有没有断、关系变了有没有写到哪一章。判断权在你手上，所以它不会误报。
        <br />
        <br />
        <b>「0 个问题」和「0 条数据」是不同的。</b>
        <br />
        没录入的时候，体检不会告诉你「恭喜通过」，它会告诉你「没有可检查的内容」。
      </div>
    </div>
  );
}
