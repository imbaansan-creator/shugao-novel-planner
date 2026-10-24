import { useEffect, useMemo, useState } from 'react';
import { useStore, makeSampleData } from './store/store';
import ChapterTable from './views/ChapterTable';
import EntityList from './views/EntityList';
import DebtBoard from './views/DebtBoard';
import SettingsView from './views/Settings';
import BookInfo from './views/BookInfo';
import WorldView from './views/WorldView';
import MapView from './views/MapView';
import Relations from './views/Relations';
import Checklist from './views/Checklist';
import { questionStats } from './domain/questions';
import type { EntityType } from './domain/types';

type View =
  | 'book'
  | 'checklist'
  | 'chapters'
  | 'debt'
  | 'world'
  | 'map'
  | 'settings'
  | 'characters'
  | 'relations'
  | 'hooks'
  | 'props'
  | 'threads';

const ALL_VIEWS: View[] = [
  'book',
  'checklist',
  'chapters',
  'debt',
  'world',
  'map',
  'settings',
  'characters',
  'relations',
  'hooks',
  'props',
  'threads'
];

function readViewFromUrl(): View {
  const v = new URLSearchParams(window.location.search).get('view');
  return v && (ALL_VIEWS as string[]).includes(v) ? (v as View) : 'chapters';
}

const ENTITY_VIEWS: Record<string, EntityType> = {
  characters: 'character',
  hooks: 'hook',
  props: 'prop',
  threads: 'thread'
};

export default function App() {
  const { data, report, issueCount, dispatch, fileName, canUndo, undo } = useStore();
  const [view, setViewState] = useState<View>(readViewFromUrl);

  const setView = (v: View) => {
    setViewState(v);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', v);
      window.history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  };

  // 字号档位（2K 屏不缩放时，默认档仍然偏小，可在设置里调）
  useEffect(() => {
    const saved = localStorage.getItem('np-font-scale');
    if (saved) document.documentElement.style.setProperty('--fs', saved);
  }, []);

  // Ctrl / Cmd + Z 撤销（输入框里也接管，因为数据本身就是输入框的内容）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // 演示入口：?demo=1，空数据时自动载入示例
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1' && data.chapters.length === 0) {
      dispatch({ type: 'load', data: makeSampleData() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c: Record<EntityType, number> = { character: 0, hook: 0, prop: 0, thread: 0 };
    for (const e of data.entities) c[e.type]++;
    return c;
  }, [data.entities]);

  const chapterCount = useMemo(
    () => data.chapters.filter((c) => c.level === 'chapter').length,
    [data.chapters]
  );
  const sectionCount = data.chapters.length - chapterCount;

  const currentEntityType = ENTITY_VIEWS[view];

  const unanswered = questionStats(data.answers).blank;

  const navItems: { key: View; label: string; count?: number }[] = [
    { key: 'book', label: '书' },
    { key: 'checklist', label: '检查单', count: unanswered },
    { key: 'chapters', label: '章节', count: chapterCount },
    { key: 'characters', label: '人物', count: counts.character },
    { key: 'relations', label: '关系', count: data.relations.length },
    { key: 'hooks', label: '钩子', count: counts.hook },
    { key: 'props', label: '道具', count: counts.prop },
    { key: 'threads', label: '线', count: counts.thread },
    { key: 'world', label: '世界观', count: data.world.length },
    { key: 'map', label: '地图', count: data.map.pins.length }
  ];

  // 线上版整个站点都要求带 sharecode，链接必须把它一起带过去；
  // 本地双击时没有这个参数，退化成普通的相对路径。
  const sharecode = new URLSearchParams(window.location.search).get('sharecode');
  const guideHref = sharecode
    ? `./使用说明.html?sharecode=${encodeURIComponent(sharecode)}`
    : './使用说明.html';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          书稿
          <small>前期规划</small>
        </div>

        {navItems.map((it) => (
          <button
            key={it.key}
            className={`nav-item ${view === it.key ? 'active' : ''}`}
            onClick={() => setView(it.key)}
          >
            <span>{it.label}</span>
            <span className="nav-count">{it.count}</span>
          </button>
        ))}

        <div className="nav-sep" />

        <button
          className={`nav-item ${view === 'debt' ? 'active' : ''}`}
          onClick={() => setView('debt')}
        >
          <span>欠债表</span>
          <span className="nav-count">{issueCount}</span>
        </button>

        <button
          className={`nav-item ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          <span>设置</span>
        </button>

        <div className="nav-sep" />
        <a
          className="nav-item nav-help"
          href={guideHref}
          target="_blank"
          rel="noopener"
          title="新窗口打开使用说明"
        >
          <span>使用说明</span>
          <span className="nav-count">↗</span>
        </a>
      </aside>

      <div className="main">
        <div className="topbar">
          <input
            className="title"
            value={data.book.title}
            onChange={(e) =>
              dispatch({ type: 'book/update', patch: { title: e.target.value } })
            }
            style={{ maxWidth: 380, fontWeight: 500 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="meta">
              {chapterCount} 章{sectionCount > 0 ? ` ${sectionCount} 节` : ''} ·{' '}
              {data.entities.length} 个对象 · {data.links.length} 条关联
            </div>
            <button
              className="undo-btn"
              disabled={!canUndo}
              onClick={undo}
              title="撤销（Ctrl + Z）"
            >
              撤销
            </button>
            <button
              className={`save-state ${fileName ? 'bound' : ''}`}
              onClick={() => setView('settings')}
              title={
                fileName
                  ? `已绑定 ${fileName}，每次改动自动写入这个文件`
                  : '当前只存在浏览器本地，点这里去绑定一个文件'
              }
            >
              {fileName ? `● ${fileName}` : '○ 仅本地'}
            </button>
          </div>
        </div>

        <div className="content">
          {view === 'book' && <BookInfo />}
          {view === 'checklist' && <Checklist onJump={(v) => setView(v as View)} />}
          {view === 'chapters' && <ChapterTable />}
          {currentEntityType && <EntityList type={currentEntityType} />}
          {view === 'debt' && <DebtBoard />}
          {view === 'relations' && <Relations />}
          {view === 'world' && <WorldView />}
          {view === 'map' && <MapView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </div>
    </div>
  );
}
