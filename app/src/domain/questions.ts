import type { Answer, AnswerState } from './types';

/**
 * 开工前的问句库。
 *
 * 判断一条问题合不合格，只有一个标准：
 * **答不上来的人，写着写着会塌。** 所以这里没有「主角的目标是什么」这种人人都能填的题。
 *
 * 分四个阶段，不是为了让流程好看，是因为在错误的时机问对的问题，
 * 得到的答案也是假的 —— 第一卷还没写，问「第二条线的交汇点」只能靠编。
 */

export type StageId = 'spine' | 'act1' | 'mid' | 'end';

export interface Question {
  id: string;
  stage: StageId;
  text: string;
  /** 为什么问这个。答不上来意味着什么。 */
  hint?: string;
  /** 能直接去别的页面看的事，就不该让人凭记忆答 */
  action?: { label: string; view: string };
}

export interface Stage {
  id: StageId;
  name: string;
  when: string;
  desc: string;
}

export const STAGES: Stage[] = [
  {
    id: 'spine',
    name: '骨架',
    when: '动笔前',
    desc: '这八条答完，才谈得上开写。答不上来的那一条，就是将来会塌的地方。'
  },
  {
    id: 'act1',
    name: '代价',
    when: '第一卷末',
    desc: '第一卷跑完，你要确认主角确实被推着走了一步，而不是原地转了一圈。'
  },
  {
    id: 'mid',
    name: '支线',
    when: '写到中段',
    desc: '中段是最容易散的：线多了、人多了，主线反而停住了。'
  },
  {
    id: 'end',
    name: '收束',
    when: '准备收尾',
    desc: '这时候要做的不是再铺，是数清楚还欠着什么。'
  }
];

export const QUESTIONS: Question[] = [
  // ---------------- 骨架 ----------------
  {
    id: 'spine-lose',
    stage: 'spine',
    text: '这本书里，主角最后会失去什么？',
    hint: '答「什么都没失去」，通常说明这本书没有代价。'
  },
  {
    id: 'spine-villain',
    stage: 'spine',
    text: '大反派是谁？他和谁有一笔没算完的旧账？这笔旧账读者最早能在哪一章看到影子？',
    hint: '连不上任何人的反派，就是个关卡怪，打完就忘。'
  },
  {
    id: 'spine-want-need',
    stage: 'spine',
    text: '主角「想要」什么？「需要」什么？这两样是同一件事吗？',
    hint: '相同，就没有弧光；相反，故事自带张力。'
  },
  {
    id: 'spine-truth',
    stage: 'spine',
    text: '全书的真相是什么：谁做的、为什么、瞒了谁？',
    hint: '真相不定下来，就别拆章节。线索一定是事后硬塞的。'
  },
  {
    id: 'spine-wrong',
    stage: 'spine',
    text: '主角在哪一章第一次做了错误的决定？代价是什么？',
    hint: '没有错误决定的主角，是被剧情推着走的。'
  },
  {
    id: 'spine-segments',
    stage: 'spine',
    text: '这本书分几个案子或几个段落？每个段落结束时，有没有一件不可逆的事发生？',
    hint: '可逆的事不是事件，是可撤销的操作。'
  },
  {
    id: 'spine-never',
    stage: 'spine',
    text: '三到五个主要人物，各自「绝不会做的事」是什么？',
    hint: '这一条决定了他们和主角之间的边界。填不出来，他就只是个道具。',
    action: { label: '去人物页', view: 'characters' }
  },
  {
    id: 'spine-end',
    stage: 'spine',
    text: '最后那一场，主角是赢了还是输了？他付出的和得到的，哪个更重？',
    hint: '赢和输都不丢人，两样一样重才丢人。'
  },

  // ---------------- 代价 ----------------
  {
    id: 'act1-change',
    stage: 'act1',
    text: '第一卷结束时，主角和开头比，哪一样东西变了？（处境 / 关系 / 认知，至少一样）',
    hint: '一样都没变，说明第一卷只是热身。'
  },
  {
    id: 'act1-extra',
    stage: 'act1',
    text: '前几章出现的人里，有几个是「换个名字也成立」的？他们各自有一件只属于自己的事吗？',
    hint: '换个名字也成立的人，读者记不住。'
  },
  {
    id: 'act1-hooks',
    stage: 'act1',
    text: '埋下的钩子里，有几个已经很久没提了？',
    hint: '不用凭记忆数，欠债表已经算好了。',
    action: { label: '去欠债表', view: 'debt' }
  },
  {
    id: 'act1-villain-win',
    stage: 'act1',
    text: '反派的第一次胜利是什么？主角因此失去了什么？',
    hint: '反派没赢过一次，最后的威胁就不成立。'
  },
  {
    id: 'act1-reader',
    stage: 'act1',
    text: '读到现在，读者最想知道的一个问题是什么？',
    hint: '写不出这个问题，说明悬念没立起来。'
  },
  {
    id: 'act1-power',
    stage: 'act1',
    text: '主角最强的能力，目前给他带来过麻烦吗？',
    hint: '能力不产生麻烦，就不是设定，是外挂。'
  },

  // ---------------- 支线 ----------------
  {
    id: 'mid-second',
    stage: 'mid',
    text: '副线或暗线现在推进到哪一步？它和主线在哪一章交汇？',
    hint: '说不出交汇章，这条线就是两条平行线，永远不会碰。'
  },
  {
    id: 'mid-stale',
    stage: 'mid',
    text: '有没有哪条线，已经很多章没有动过？',
    hint: '断了的线不一定是错的，但你得知道自己在哪断了。',
    action: { label: '去欠债表', view: 'debt' }
  },
  {
    id: 'mid-relation',
    stage: 'mid',
    text: '有哪一对人物的关系已经变了，但读者没看见变化的过程？',
    hint: '关系页里标着「缺转折」的那几条，就是这个问题。',
    action: { label: '去关系页', view: 'relations' }
  },
  {
    id: 'mid-fake-win',
    stage: 'mid',
    text: '中段有没有一个「主角以为赢了，其实是输了」的节点？',
    hint: '全书如果一路顺，读者在第二百页就走了。'
  },
  {
    id: 'mid-cut',
    stage: 'mid',
    text: '现在删掉任意一个配角，故事会塌吗？如果不会，他为什么还在？',
    hint: '答「他很有魅力」不算答案。'
  },

  // ---------------- 收束 ----------------
  {
    id: 'end-hooks',
    stage: 'end',
    text: '每一个埋过的硬钩子，都找到回收的章节了吗？',
    hint: '欠债表里「埋了没收」那一栏应该清空，或者你想清楚为什么不收。',
    action: { label: '去欠债表', view: 'debt' }
  },
  {
    id: 'end-motive',
    stage: 'end',
    text: '反派的动机，在最后一战之前有没有被完整地说出来一次？',
    hint: '没说过，读者只会觉得他坏；说过了，他才是个人。'
  },
  {
    id: 'end-choice',
    stage: 'end',
    text: '主角最后做的那个选择，和他第一章的选择是同一个逻辑吗？如果是，他成长了吗？',
    hint: '有些书的主角本来就不该成长（李寻欢就是）。但你要知道自己是哪一种。'
  },
  {
    id: 'end-remember',
    stage: 'end',
    text: '合上书之后，读者会记住哪两三个人？他们现在的戏份够吗？',
    hint: '规划能保证不写崩，保证不了这个。但你可以给它留位置。'
  },
  {
    id: 'end-blank',
    stage: 'end',
    text: '这本书里有哪一处，是你故意不解释的？',
    hint: '留白是设计，不是漏洞。写下来，它就不会在将来被误补。'
  }
];

export const STATE_LABEL: Record<AnswerState, string> = {
  blank: '未答',
  draft: '有想法',
  pending: '待验证',
  confirmed: '已确认',
  na: '不适用'
};

export const STATE_ORDER: AnswerState[] = ['blank', 'draft', 'pending', 'confirmed', 'na'];

export interface AnswerStats {
  total: number;
  blank: number;
  draft: number;
  pending: number;
  confirmed: number;
  na: number;
}

/** 统计的是「题目」的作答情况，不是答案条数：没写过的题也算未答 */
export function questionStats(answers: Answer[]): AnswerStats {
  const byQuestion = new Map<string, AnswerState>();
  for (const a of answers) byQuestion.set(a.questionId, a.state);

  const stats: AnswerStats = {
    total: QUESTIONS.length,
    blank: 0,
    draft: 0,
    pending: 0,
    confirmed: 0,
    na: 0
  };

  for (const q of QUESTIONS) {
    const s = byQuestion.get(q.id) ?? 'blank';
    stats[s]++;
  }
  return stats;
}

export function stageOf(id: string): StageId | null {
  return QUESTIONS.find((q) => q.id === id)?.stage ?? null;
}
