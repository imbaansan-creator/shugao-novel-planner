import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react';
import type {
  Ack,
  BookData,
  Chapter,
  Entity,
  EntityType,
  Link,
  MapPin,
  WorldEntry,
  Role,
  Settings,
  Relation,
  Answer,
  AnswerState
} from '../domain/types';
import { uid } from '../domain/types';
import { makeSampleData } from '../domain/sample';
import { runWithData } from '../domain/checks';
import { moveSection, renumber } from '../domain/chapters';
import { isRoleAllowed, sanitizeLinks } from '../domain/roles';
import {
  canUseFileSystem,
  dropHandle,
  pickSaveFile,
  restoreHandle,
  writeToFile,
  type SaveHandle
} from './fileSaver';

const STORAGE_KEY = 'novel-planner:v1';

function emptyData(): BookData {
  const now = Date.now();
  return {
    version: 2,
    book: {
      id: uid(),
      title: '未命名',
      genre: '',
      targetWords: 0,
      logline: '',
      synopsis: '',
      theme: '',
      notes: '',
      lastChapterId: null,
      createdAt: now,
      updatedAt: now
    },
    chapters: [],
    entities: [],
    links: [],
    acks: [],
    settings: { c3Interval: 15, c4Stale: 10 },
    relations: [],
    answers: [],
    world: [],
    map: { image: '', pins: [] }
  };
}

export type Action =
  | { type: 'load'; data: BookData }
  | { type: 'book/update'; patch: Partial<BookData['book']> }
  | { type: 'chapter/add'; parentId?: string }
  | { type: 'chapter/update'; id: string; patch: Partial<Chapter> }
  | { type: 'chapter/remove'; id: string }
  | { type: 'chapter/move'; id: string; dir: -1 | 1 }
  | { type: 'entity/add'; entityType: EntityType }
  | { type: 'entity/update'; id: string; patch: Partial<Entity> }
  | { type: 'entity/remove'; id: string }
  | { type: 'link/add'; entityId: string; chapterId: string; role: Role }
  | { type: 'link/remove'; id: string }
  | { type: 'ack/toggle'; entityId: string; checkId: Ack['checkId'] }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'world/add' }
  | { type: 'world/update'; id: string; patch: Partial<WorldEntry> }
  | { type: 'world/remove'; id: string }
  | { type: 'map/image'; image: string }
  | { type: 'map/pin/add'; x: number; y: number }
  | { type: 'map/pin/update'; id: string; patch: Partial<MapPin> }
  | { type: 'map/pin/remove'; id: string }
  | { type: 'relation/add' }
  | { type: 'relation/update'; id: string; patch: Partial<Relation> }
  | { type: 'relation/remove'; id: string }
  | { type: 'answer/set'; questionId: string; patch: Partial<Omit<Answer, 'questionId'>> }
  | { type: 'undo' };

interface History {
  past: BookData[];
  present: BookData;
}

/** 连续输入合并成一步撤销：同一个字段 700ms 内的改动只留一个还原点 */
let mergeKey = '';
let mergeAt = 0;

function historyReducer(state: History, action: Action): History {
  if (action.type === 'undo') {
    if (state.past.length === 0) return state;
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1]
    };
  }

  const next = reducer(state.present, action);
  if (next === state.present) return state;

  // 载入（示例 / 快照 / 导入）也进撤销栈：误点一次能回来
  if (action.type === 'load') {
    return { past: [...state.past, state.present].slice(-60), present: next };
  }

  const withPatch = action as { id?: string; patch?: Record<string, unknown> };
  const key =
    withPatch.id && withPatch.patch
      ? `${action.type}:${withPatch.id}:${Object.keys(withPatch.patch).join(',')}`
      : '';
  const now = Date.now();
  const merge = key !== '' && key === mergeKey && now - mergeAt < 700;
  mergeKey = key;
  mergeAt = now;

  return {
    past: merge ? state.past : [...state.past, state.present].slice(-60),
    present: next
  };
}

// ---------------------------------------------------------------- 自动快照

const SNAP_KEY = 'novel-planner:snapshots';
const SNAP_MAX = 6;
const SNAP_EVERY = 10 * 60 * 1000;

export interface Snapshot {
  at: number;
  data: BookData;
}

function readSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeSnapshots(list: Snapshot[]) {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(list.slice(-SNAP_MAX)));
  } catch {
    /* 配额满了就放弃这一版，不影响主数据 */
  }
}

/** 快照不存地图底图：base64 一张就几百 KB，几版就把配额吃光 */
function snapshotOf(d: BookData): BookData {
  return { ...d, map: { ...d.map, image: '' } };
}

function reducer(state: BookData, action: Action): BookData {
  switch (action.type) {
    case 'load':
      return action.data;

    case 'book/update':
      return { ...state, book: { ...state.book, ...action.patch, updatedAt: Date.now() } };

    case 'chapter/add': {
      if (action.parentId) {
        const siblings = state.chapters.filter(
          (c) => c.level === 'section' && c.parentId === action.parentId
        );
        const no = siblings.reduce((m, c) => Math.max(m, c.no), 0) + 1;
        const section: Chapter = {
          id: uid(),
          no,
          title: '',
          summary: '',
          change: '',
          timeLabel: '',
          timeKind: '',
          status: 'todo',
          level: 'section',
          parentId: action.parentId
        };
        return { ...state, chapters: [...state.chapters, section] };
      }

      const no =
        state.chapters
          .filter((c) => c.level === 'chapter')
          .reduce((m, c) => Math.max(m, c.no), 0) + 1;
      const chapter: Chapter = {
        id: uid(),
        no,
        title: '',
        summary: '',
        change: '',
        timeLabel: '',
        timeKind: '',
        status: 'todo',
        level: 'chapter',
        parentId: null
      };
      return { ...state, chapters: [...state.chapters, chapter] };
    }

    case 'chapter/update':
      return {
        ...state,
        chapters: state.chapters.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        )
      };

    case 'chapter/remove': {
      const childIds = state.chapters
        .filter((c) => c.parentId === action.id)
        .map((c) => c.id);
      const kill = new Set([action.id, ...childIds]);
      return {
        ...state,
        chapters: renumber(state.chapters.filter((c) => !kill.has(c.id))),
        links: state.links.filter((l) => !kill.has(l.chapterId))
      };
    }

    case 'chapter/move':
      return { ...state, chapters: moveSection(state.chapters, action.id, action.dir) };

    case 'entity/add': {
      const isChar = action.entityType === 'character';
      const entity: Entity = {
        id: uid(),
        type: action.entityType,
        code: '',
        name: isChar ? '新人物' : '未命名',
        layer: '',
        data: isChar ? { aliases: [], base: '', never: '' } : {},
        planned: null
      };
      return { ...state, entities: [...state.entities, entity] };
    }

    case 'entity/update':
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e
        )
      };

    case 'entity/remove':
      return {
        ...state,
        entities: state.entities.filter((e) => e.id !== action.id),
        links: state.links.filter((l) => l.entityId !== action.id),
        acks: state.acks.filter((a) => a.entityId !== action.id),
        relations: state.relations.filter(
          (r) => r.aId !== action.id && r.bId !== action.id
        )
      };

    case 'link/add': {
      const entity = state.entities.find((e) => e.id === action.entityId);
      // 角色必须与实体类型匹配：人物不会被「埋」
      if (!entity || !isRoleAllowed(entity.type, action.role)) return state;

      const dup = state.links.some(
        (l) =>
          l.entityId === action.entityId &&
          l.chapterId === action.chapterId &&
          l.role === action.role
      );
      if (dup) return state;
      const link: Link = {
        id: uid(),
        entityId: action.entityId,
        chapterId: action.chapterId,
        role: action.role,
        note: ''
      };
      return { ...state, links: [...state.links, link] };
    }

    case 'link/remove':
      return { ...state, links: state.links.filter((l) => l.id !== action.id) };

    case 'ack/toggle': {
      const exists = state.acks.some(
        (a) => a.entityId === action.entityId && a.checkId === action.checkId
      );
      if (exists) {
        return {
          ...state,
          acks: state.acks.filter(
            (a) => !(a.entityId === action.entityId && a.checkId === action.checkId)
          )
        };
      }
      const ack: Ack = { entityId: action.entityId, checkId: action.checkId, reason: '' };
      return { ...state, acks: [...state.acks, ack] };
    }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'relation/add':
      return {
        ...state,
        relations: [
          ...state.relations,
          {
            id: uid(),
            aId: '',
            bId: '',
            label: '',
            from: '',
            to: '',
            changedAt: null,
            note: ''
          }
        ]
      };

    case 'relation/update':
      return {
        ...state,
        relations: state.relations.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        )
      };

    case 'relation/remove':
      return { ...state, relations: state.relations.filter((r) => r.id !== action.id) };

    case 'answer/set': {
      const existing = state.answers.find((a) => a.questionId === action.questionId);
      if (!existing) {
        return {
          ...state,
          answers: [
            ...state.answers,
            {
              questionId: action.questionId,
              text: action.patch.text ?? '',
              state: (action.patch.state ?? 'blank') as AnswerState,
              updatedAt: Date.now()
            }
          ]
        };
      }
      return {
        ...state,
        answers: state.answers.map((a) =>
          a.questionId === action.questionId
            ? { ...a, ...action.patch, updatedAt: Date.now() }
            : a
        )
      };
    }

    case 'world/add':
      return {
        ...state,
        world: [...state.world, { id: uid(), category: '未分类', title: '', body: '' }]
      };

    case 'world/update':
      return {
        ...state,
        world: state.world.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w))
      };

    case 'world/remove':
      return { ...state, world: state.world.filter((w) => w.id !== action.id) };

    case 'map/image':
      return { ...state, map: { ...state.map, image: action.image } };

    case 'map/pin/add':
      return {
        ...state,
        map: {
          ...state.map,
          pins: [
            ...state.map.pins,
            { id: uid(), x: action.x, y: action.y, name: '新地点', note: '' }
          ]
        }
      };

    case 'map/pin/update':
      return {
        ...state,
        map: {
          ...state.map,
          pins: state.map.pins.map((p) =>
            p.id === action.id ? { ...p, ...action.patch } : p
          )
        }
      };

    case 'map/pin/remove':
      return {
        ...state,
        map: { ...state.map, pins: state.map.pins.filter((p) => p.id !== action.id) }
      };

    default:
      return state;
  }
}

interface Stored {
  savedAt: number;
  data: BookData;
}

/** 兼容新旧两种存储格式，并补齐后加的字段 */
function parseStored(raw: string): BookData | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate: BookData | null =
      parsed.data && parsed.data.book ? parsed.data : parsed.book ? parsed : null;
    if (!candidate || !Array.isArray(candidate.chapters)) return null;

    candidate.chapters = candidate.chapters.map((c) => {
      const raw2 = c as Partial<Chapter>;
      return {
        ...raw2,
        level: raw2.level ?? 'chapter',
        parentId: raw2.parentId ?? null,
        timeLabel: raw2.timeLabel ?? '',
        timeKind: raw2.timeKind ?? ''
      } as Chapter;
    });

    candidate.book = {
      ...candidate.book,
      logline: candidate.book.logline ?? '',
      synopsis: candidate.book.synopsis ?? '',
      theme: candidate.book.theme ?? '',
      notes: candidate.book.notes ?? ''
    };

    // 清理类型不匹配的关联：历史上人物可能被误挂成「埋 / 提 / 收 / 弃」
    candidate.links = sanitizeLinks(candidate.entities, candidate.links);

    candidate.relations = Array.isArray(candidate.relations) ? candidate.relations : [];
    const charIds = new Set(
      candidate.entities.filter((e) => e.type === 'character').map((e) => e.id)
    );
    candidate.relations = candidate.relations.filter(
      (r) => charIds.has(r.aId) && charIds.has(r.bId) && r.aId !== r.bId
    );

    candidate.answers = Array.isArray(candidate.answers) ? candidate.answers : [];

    candidate.world = Array.isArray(candidate.world) ? candidate.world : [];
    candidate.map =
      candidate.map && Array.isArray(candidate.map.pins)
        ? candidate.map
        : { image: '', pins: [] };

    return candidate;
  } catch {
    return null;
  }
}

function loadInitial(): BookData {
  const raw = localStorage.getItem(STORAGE_KEY);
  // 第一次打开（本地什么都没有）先给一份填好的示例：
  // 空表格看不出这个工具在干什么，示例才看得出来。设置页可以一键清空。
  if (!raw) return makeSampleData();
  const parsed = parseStored(raw) ?? emptyData();
  // 示例数据升级：只认这个标题，用户自己建的书不会被碰。
  // v1 = 8 章旧样例；v2 = 关联挂在章上；v3 = 人物关系；v4 = 开工前的问句。
  if (
    parsed.book.title === '多情剑客无情剑（示例）' ||
    (parsed.book.title === '多情剑客无情剑' && (parsed.version ?? 1) < 4)
  ) {
    return makeSampleData();
  }
  return parsed;
}

interface StoreValue {
  data: BookData;
  dispatch: React.Dispatch<Action>;
  report: ReturnType<typeof runWithData>;
  issueCount: number;
  canUndo: boolean;
  undo: () => void;
  snapshots: Snapshot[];
  saveSnapshot: () => void;
  restoreSnapshot: (at: number) => void;
  fileName: string | null;
  canBindFile: boolean;
  bindFile: () => Promise<void>;
  unbindFile: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hist, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: loadInitial()
  }));
  const data = hist.present;
  const canUndo = hist.past.length > 0;
  const timer = useRef<number | null>(null);
  const skipWrite = useRef(true);
  const handleRef = useRef<SaveHandle | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // 启动时恢复上次绑定的本地文件，并以较新的一方为准
  useEffect(() => {
    (async () => {
      const handle = await restoreHandle();
      if (!handle) return;
      handleRef.current = handle;
      setFileName(handle.name);

      try {
        const file = await handle.getFile();
        const text = await file.text();
        const remote = JSON.parse(text);
        const remoteAt = remote?.savedAt ?? 0;
        const localRaw = localStorage.getItem(STORAGE_KEY);
        const localAt = localRaw ? JSON.parse(localRaw).savedAt ?? 0 : 0;

        if (remoteAt >= localAt) {
          const parsed = parseStored(text);
          if (parsed) {
            skipWrite.current = true;
            dispatch({ type: 'load', data: parsed });
          }
        }
      } catch {
        /* 文件读不出来就继续用本地数据 */
      }
    })();
  }, []);

  // 其他标签页写入时，同步到当前页，避免两边各写各的互相覆盖
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const incoming = parseStored(e.newValue);
      if (!incoming) return;
      skipWrite.current = true;
      dispatch({ type: 'load', data: incoming });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const payload: Stored = { savedAt: Date.now(), data };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* 忽略配额错误 */
      }
      if (handleRef.current) {
        void writeToFile(handleRef.current, payload);
      }
    }, 300);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data]);

  const report = useMemo(
    () =>
      runWithData(
        data.chapters,
        data.entities,
        data.links,
        data.acks,
        data.settings,
        data.relations
      ),
    [data]
  );

  const issueCount = report.results.reduce((s, r) => s + r.issues.length, 0);

  const dataRef = useRef(data);
  dataRef.current = data;
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => readSnapshots());

  const takeSnapshot = () => {
    // 空书不值得存：启动瞬间还没载入数据时会走到这里
    if (dataRef.current.chapters.length === 0 && dataRef.current.entities.length === 0) return;
    const list = readSnapshots();
    const payload = snapshotOf(dataRef.current);
    const last = list[list.length - 1];
    if (last && JSON.stringify(last.data) === JSON.stringify(payload)) {
      setSnapshots(list);
      return;
    }
    const next = [...list, { at: Date.now(), data: payload }].slice(-SNAP_MAX);
    writeSnapshots(next);
    setSnapshots(next);
  };

  // 打开就存一版，之后每十分钟存一版（内容没变就跳过）
  useEffect(() => {
    takeSnapshot();
    const t = window.setInterval(takeSnapshot, SNAP_EVERY);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreSnapshot = (at: number) => {
    const snap = readSnapshots().find((x) => x.at === at);
    if (!snap) return;
    skipWrite.current = true;
    dispatch({ type: 'load', data: snap.data });
  };

  const bindFile = async () => {
    const handle = await pickSaveFile();
    if (!handle) return;
    handleRef.current = handle;
    setFileName(handle.name);
    await writeToFile(handle, { savedAt: Date.now(), data });
  };

  const unbindFile = async () => {
    handleRef.current = null;
    setFileName(null);
    await dropHandle();
  };

  const value: StoreValue = {
    data,
    dispatch,
    report,
    issueCount,
    canUndo,
    undo: () => dispatch({ type: 'undo' }),
    snapshots,
    saveSnapshot: takeSnapshot,
    restoreSnapshot,
    fileName,
    canBindFile: canUseFileSystem(),
    bindFile,
    unbindFile
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用');
  return ctx;
}

export { makeSampleData, emptyData };
