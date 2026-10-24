export type Role = 'plant' | 'hint' | 'pay' | 'drop' | 'appear' | 'hold';
export type EntityType = 'character' | 'hook' | 'prop' | 'thread';
export type EntityLayer = '' | 'core' | 'major' | 'func' | 'extra';
export type ChapterStatus = 'todo' | 'writing' | 'done';

export interface Book {
  id: string;
  title: string;
  genre: string;
  targetWords: number;
  /** 一句话故事 */
  logline: string;
  /** 故事概括 */
  synopsis: string;
  /** 想表达什么 / 中心思想 */
  theme: string;
  /** 其他备注 */
  notes: string;
  lastChapterId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  /** 章：全书章号；节：在所属章内的节号 */
  no: number;
  title: string;
  summary: string;
  change: string;
  timeLabel: string;
  /** 时间的类型：绝对（2024-03-05）/ 相对（三日后），空表示没标 */
  timeKind: 'absolute' | 'relative' | '';
  status: ChapterStatus;
  /** 层级：章 / 节 */
  level: 'chapter' | 'section';
  /** 节所属的章 id；章为 null */
  parentId: string | null;
}

/** 把章或节归一到「章号」，所有检查都以章为单位计算 */
export function normalizeChapterNo(c: Chapter, all: Chapter[]): number {
  if (c.level === 'section' && c.parentId) {
    const parent = all.find((x) => x.id === c.parentId);
    return parent ? parent.no : c.no;
  }
  return c.no;
}

/** 显示用标签：第 2 章 / 第 2 章·第 1 节 */
export function chapterLabel(c: Chapter, all: Chapter[]): string {
  if (c.level === 'section' && c.parentId) {
    const parent = all.find((x) => x.id === c.parentId);
    return parent ? `第 ${parent.no} 章 · 第 ${c.no} 节` : `第 ${c.no} 节`;
  }
  return `第 ${c.no} 章`;
}

/** 排序键：先按所属章号，章在前、节在后，节内再按节号 */
export function chapterSortKey(c: Chapter, all: Chapter[]): [number, number, number] {
  const parentNo = normalizeChapterNo(c, all);
  return [parentNo, c.level === 'chapter' ? 0 : 1, c.no];
}

export interface Entity {
  id: string;
  type: EntityType;
  code: string;
  name: string;
  layer: EntityLayer;
  /** 各类型的扩展字段 */
  data: {
    aliases?: string[];
    base?: string;
    never?: string;
    readerAsk?: string;
    functions?: string[];
    hardness?: 'hard' | 'soft';
    holder?: string;
    /** 人物 */
    gender?: string;
    age?: string;
    identity?: string;
    personality?: string;
    appearance?: string;
    /** 道具 */
    propKind?: string;
    origin?: string;
    function?: string;
  };
  /** 双轨值：原计划快照 */
  planned?: { name?: string } | null;
}

export interface Link {
  id: string;
  entityId: string;
  chapterId: string;
  role: Role;
  note: string;
}

/** 一条问题的作答状态。刻意不用「勾/没勾」两态。 */
export type AnswerState = 'blank' | 'draft' | 'pending' | 'confirmed' | 'na';

/** 作者对某个问题的回答。题目本身在 domain/questions.ts。 */
export interface Answer {
  questionId: string;
  text: string;
  state: AnswerState;
  updatedAt: number;
}

/** 人物之间的一条关系。只记会发生变化的那些。 */
export interface Relation {
  id: string;
  aId: string;
  bId: string;
  /** 关系叫什么：朋友 / 师徒 / 夫妻 / 仇敌…… */
  label: string;
  /** 起始状态 */
  from: string;
  /** 结束状态；和起始一样表示没变 */
  to: string;
  /** 在哪一章变的；空 = 还没标 */
  changedAt: string | null;
  note: string;
}

export interface Ack {
  entityId: string;
  checkId: 'C1' | 'C2' | 'C3' | 'C4' | 'C5';
  reason: string;
}

export interface Settings {
  c3Interval: number;
  c4Stale: number;
}

/** 世界观设定：一条可以自由写的资料，按类分组 */
export interface WorldEntry {
  id: string;
  category: string;
  title: string;
  body: string;
}

/** 地图上的一个点 */
export interface MapPin {
  id: string;
  /** 相对坐标，0–1，不随图片尺寸变化 */
  x: number;
  y: number;
  name: string;
  note: string;
}

export interface MapData {
  /** dataURL；空字符串表示还没上传底图 */
  image: string;
  pins: MapPin[];
}

export interface BookData {
  /** 数据结构版本，用来识别旧示例并升级 */
  version?: number;
  book: Book;
  chapters: Chapter[];
  entities: Entity[];
  links: Link[];
  acks: Ack[];
  settings: Settings;
  relations: Relation[];
  answers: Answer[];
  world: WorldEntry[];
  map: MapData;
}

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const ROLE_LABEL: Record<Role, string> = {
  plant: '埋',
  hint: '提',
  pay: '收',
  drop: '弃',
  appear: '出场',
  hold: '持有'
};

export const TYPE_LABEL: Record<EntityType, string> = {
  character: '人物',
  hook: '钩子',
  prop: '道具',
  thread: '线'
};

export const STATUS_LABEL: Record<ChapterStatus, string> = {
  todo: '待写',
  writing: '在写',
  done: '完成'
};
