import type { Answer, BookData, Chapter, Entity, Link, Role } from './types';
import { uid } from './types';

/**
 * 示例数据：《多情剑客无情剑》结构档案
 *
 * 说明两件事，免得被当成原著回目：
 * 1. 原著 90 章，分上中下三部。这里按剧情段落重组成 16 章 / 48 节，
 *    是「用这本书当规划样本」，不是复刻目录。
 * 2. 时间一律用相对表述。原著不标确切年份，硬填日期等于编。
 *
 * 阈值设成 c3=6 / c4=6，适配 16 章的体量。
 */

interface SecSeed {
  title: string;
  summary: string;
  change?: string;
  time: string;
}

interface ChSeed {
  title: string;
  summary: string;
  change: string;
  time: string;
  sections: SecSeed[];
}

const SEEDS: ChSeed[] = [
  {
    title: '飞刀与快剑',
    summary: '李寻欢入关，在风雪里遇见一个连名字都懒得多说的少年',
    change: '处境：一个人变成两个人',
    time: '入冬',
    sections: [
      { title: '风雪', summary: '李寻欢独自入关，马车上刻着一尊木像', time: '入冬第一场雪' },
      { title: '酒肆', summary: '阿飞走进来，坐下，不说话', time: '当夜' },
      { title: '快剑', summary: '阿飞一剑出手，没人看清他是怎么拔的', change: '处境：李寻欢身边多了一个人', time: '同夜' }
    ]
  },
  {
    title: '金丝甲',
    summary: '金狮镖局失窃，所有线索都指向李寻欢',
    change: '身份：从路人变成嫌犯',
    time: '数日后',
    sections: [
      { title: '金狮镖局', summary: '查猛与虞二拐子找上门，问金丝甲的下落', time: '次日' },
      { title: '疑云', summary: '梅花盗的名字第一次被提起，同时被提起的还有李寻欢', change: '信息：江湖上开始有人相信他是凶手', time: '同日' },
      { title: '中毒', summary: '李寻欢身中剧毒，倒在路上', change: '处境：他连自证的能力都没有了', time: '三日后' }
    ]
  },
  {
    title: '梅二先生',
    summary: '七妙人之一的妙郎中把他从鬼门关拉回来',
    change: '处境：活下来了，但欠了人情',
    time: '又三日',
    sections: [
      { title: '妙郎中', summary: '梅二先生说他这身子早该垮了', time: '当夜' },
      { title: '偷袭', summary: '一个孩子趁他病中下手，招招要命', change: '处境：他被一个孩子逼到绝路', time: '翌日' },
      { title: '废武功', summary: '李寻欢废了对方的武功，才知道这是龙啸云和林诗音的儿子', change: '关系：他欠下了一笔还不清的债', time: '同日' }
    ]
  },
  {
    title: '兴云庄',
    summary: '回到李园，门口挂的已经是「兴云庄」',
    change: '身份：他从主人变成了客人',
    time: '深冬',
    sections: [
      { title: '故园', summary: '一草一木都没改，改的是主人', change: '处境：他站在自己家里，被请进去', time: '腊月初' },
      { title: '林诗音', summary: '旧人重逢，她已是龙夫人', change: '关系：旧情被重新点亮，也重新压住', time: '同日' },
      { title: '木像', summary: '木像被人看见，三个人都不说话', change: '关系：谁都知道，谁都不说', time: '当夜' }
    ]
  },
  {
    title: '栽赃',
    summary: '「铁面无私」当众发难，龙啸云顺水推舟',
    change: '身份：从客人变成阶下囚',
    time: '腊月',
    sections: [
      { title: '赵正义与田七', summary: '一个讲公道，一个讲规矩，配合得严丝合缝', time: '腊月中旬' },
      { title: '梅花盗之名', summary: '李寻欢被指为梅花盗，没人替他说话', change: '处境：全江湖都成了他的敌人', time: '同日' },
      { title: '囚庄', summary: '三人对质，让妻的真相被摊开', change: '关系：恩义线第一次出现裂缝', time: '当夜' }
    ]
  },
  {
    title: '少林',
    summary: '押上少林受审，结果少林自己也不干净',
    change: '处境：他连审判的地方都不能信',
    time: '正月',
    sections: [
      { title: '押解', summary: '心眉大师亲自押他上山', time: '正月初' },
      { title: '五毒童子', summary: '途中有人下毒，心眉中毒', change: '信息：想让他死的人，不止江湖上的', time: '途中' },
      { title: '藏经', summary: '藏经阁失窃，心鉴露了形迹', change: '信息：少林内部有内奸', time: '三日后' }
    ]
  },
  {
    title: '百晓生',
    summary: '写《兵器谱》的那位「武林智者」，原来是局里的人',
    change: '信息：所谓的公道，本身就是圈套',
    time: '二月',
    sections: [
      { title: '武林智者', summary: '百晓生来了，说话很慢，每一句都在给人定罪', time: '二月初' },
      { title: '心鉴之死', summary: '心鉴死在阿飞剑下', change: '关系：阿飞为他杀了人', time: '同日' },
      { title: '飞刀出手', summary: '李寻欢杀了百晓生', change: '处境：他再没有退路', time: '当夜' }
    ]
  },
  {
    title: '水落石出',
    summary: '梅花盗的真相出来了，代价是阿飞选了她',
    change: '关系：李寻欢赢了案子，输了阿飞',
    time: '春',
    sections: [
      { title: '推断', summary: '李寻欢推出：梅花盗是林仙儿', time: '初春' },
      { title: '承认', summary: '林仙儿向阿飞承认，阿飞没有杀她', change: '关系：阿飞的信仰第一次崩塌，又被他按了回去', time: '同日' },
      { title: '隐居', summary: '两人隐居梅林；兴云庄败了', change: '处境：李寻欢一个人留在原地', time: '数日后' }
    ]
  },
  {
    title: '兴云庄之宝',
    summary: '一封匿名信，把整个江湖引到一座空庄子',
    change: '处境：旧宅变成屠场',
    time: '两年后的九月十五',
    sections: [
      { title: '匿名信', summary: '「九月十五，兴云庄有重宝将现」', time: '八月' },
      { title: '九月十五', summary: '为一件谁也没见过的东西，人开始互相杀', change: '处境：所有人都成了别人的机会', time: '九月十五' },
      { title: '血战', summary: '燕双飞、高行空、诸葛刚先后死在这里', change: '信息：这场血战背后有人在数结果', time: '同日' }
    ]
  },
  {
    title: '郭嵩阳',
    summary: '兵器谱第四找上第三，想看看自己差在哪',
    change: '关系：多了一个懂他的人',
    time: '九月末',
    sections: [
      { title: '枫林', summary: '郭嵩阳找上门，要试李寻欢的刀', time: '九月末' },
      { title: '认输', summary: '两人各退一步，郭嵩阳认了', change: '关系：敌对变成敬重', time: '同日' },
      { title: '知己', summary: '兵器谱第四和第三成了朋友', change: '关系：李寻欢有了一个能托付的人', time: '当夜' }
    ]
  },
  {
    title: '说书祖孙',
    summary: '破店里来了个说书的姑娘，和一个不起眼的老头',
    change: '信息：兵器谱第一就在眼前',
    time: '秋末',
    sections: [
      { title: '孙驼子小店', summary: '李寻欢在这里喝了一年酒', time: '秋末' },
      { title: '孙小红', summary: '说书的姑娘来了，带来一句关于沈浪的旧话', change: '信息：阿飞的身世露出一条缝', time: '同日' },
      { title: '天机老人', summary: '老人一步逼退上官金虹', change: '信息：这个老头就是兵器谱第一', time: '当夜' }
    ]
  },
  {
    title: '蓝蝎子',
    summary: '关外来的女人为伊哭寻仇，李寻欢折了她的手腕又放了她',
    change: '关系：仇人变成了欠人情的人',
    time: '入冬',
    sections: [
      { title: '寻仇', summary: '蓝蝎子为伊哭而来，一出手就是杀招', time: '入冬' },
      { title: '折腕', summary: '李寻欢折了她的手腕，然后放她走', change: '关系：她欠了他一条命', time: '同日' },
      { title: '走', summary: '她走了，没有回头', time: '当夜' }
    ]
  },
  {
    title: '梅林',
    summary: '阿飞住在梅林里，剑慢了，人也钝了',
    change: '处境：阿飞正在被一点点抽空',
    time: '冬',
    sections: [
      { title: '铃铃', summary: '梅林里有个什么都敢问的小姑娘', time: '初冬' },
      { title: '迷药', summary: '阿飞每天喝的那碗汤里有东西', change: '信息：他的武功在退', time: '冬夜' },
      { title: '看不见', summary: '李寻欢看出来了，阿飞看不见', change: '关系：他救不了不肯被救的人', time: '同日' }
    ]
  },
  {
    title: '剑痕',
    summary: '郭嵩阳把尸体挂在泉水旁，为了让李寻欢看清那一剑',
    change: '信息：荆无命的剑，快得没有第二招',
    time: '冬末',
    sections: [
      { title: '泉水', summary: '郭嵩阳的尸体挂在泉水旁，伤口被水冲得干干净净', time: '冬末' },
      { title: '剑法', summary: '李寻欢从那些伤口上读出了荆无命的剑', change: '信息：他知道了自己可能接不住', time: '同日' },
      { title: '吕凤先', summary: '兵器谱第五被上官金虹彻底击垮', change: '信息：上官金虹不杀人，他毁人', time: '数日后' }
    ]
  },
  {
    title: '决裂',
    summary: '李寻欢设了一个局，让阿飞亲眼看见',
    change: '关系：阿飞活过来了，林仙儿死了（不是身体）',
    time: '腊月',
    sections: [
      { title: '撞破', summary: '阿飞推开门，看见了他不该看见的东西', time: '腊月初' },
      { title: '醒悟', summary: '阿飞走了，剑重新变快', change: '关系：他把自己捡了回来', time: '次日' },
      { title: '下场', summary: '林仙儿被上官金虹丢下，从此堕入风尘', change: '关系：操纵别人的人，最后没人可操纵', time: '数日后' }
    ]
  },
  {
    title: '决战',
    summary: '天机老人先死，然后轮到上官金虹',
    change: '全部：钩子收束，他失去的比得到的多',
    time: '除夕前后',
    sections: [
      { title: '天机', summary: '天机老人替李寻欢挡下这一战，死在龙凤环下', change: '关系：又一个人替他死了', time: '除夕前' },
      { title: '飞刀', summary: '上官金虹想看看自己能不能接住那一刀', change: '信息：他死于自负，不是死于刀', time: '除夕' },
      { title: '归隐', summary: '李寻欢与孙小红走了；木像不再刻了', change: '处境：他终于不再需要一个替身', time: '数日后' }
    ]
  }
];

export function makeSampleData(): BookData {
  const now = Date.now();

  const chapters: Chapter[] = [];
  const sectionIndex = new Map<string, string>();

  SEEDS.forEach((seed, i) => {
    const chapterId = uid();
    chapters.push({
      id: chapterId,
      no: i + 1,
      title: seed.title,
      summary: seed.summary,
      change: seed.change,
      timeLabel: seed.time,
      timeKind: 'relative',
      status: 'done',
      level: 'chapter',
      parentId: null
    });

    seed.sections.forEach((s, j) => {
      const id = uid();
      sectionIndex.set(`${i + 1}.${j + 1}`, id);
      chapters.push({
        id,
        no: j + 1,
        title: s.title,
        summary: s.summary,
        change: s.change ?? '',
        timeLabel: s.time,
        timeKind: 'relative',
        status: 'done',
        level: 'section',
        parentId: chapterId
      });
    });
  });

  const chapterByNo = new Map<number, string>();
  for (const c of chapters) {
    if (c.level === 'chapter') chapterByNo.set(c.no, c.id);
  }

  const entities: Entity[] = [];
  const links: Link[] = [];

  /** 章节号写 4；节写 '4.3' */
  const resolve = (key: number | string): string =>
    typeof key === 'number' ? chapterByNo.get(key)! : sectionIndex.get(key)!;

  const addLink = (entityId: string, key: number | string, role: Role, note = '') => {
    links.push({ id: uid(), entityId, chapterId: resolve(key), role, note });
  };

  const addEntity = (e: Omit<Entity, 'id' | 'planned'>): Entity => {
    const full: Entity = { ...e, id: uid(), planned: null };
    entities.push(full);
    return full;
  };

  // ---------------------------------------------------------------- 人物

  const character = (
    name: string,
    layer: Entity['layer'],
    data: Entity['data'],
    times: (number | string)[]
  ): Entity => {
    const e = addEntity({ type: 'character', code: '', name, layer, data });
    for (const n of times) addLink(e.id, n, 'appear');
    return e;
  };

  character(
    '李寻欢',
    'core',
    {
      aliases: ['小李探花', '李探花', '探花郎', '小李飞刀'],
      gender: '男',
      age: '三十余',
      identity: '探花出身，兵器谱第三',
      personality: '宁可把东西让出去，也不肯欠别人一分情',
      appearance: '脸色发白，常咳嗽，手里总有一把小刀',
      base: '无（一直在路上）',
      never: '绝不主动去要回自己已经让出去的东西'
    },
    [
      '1.1', '1.3', '2.1', '2.3', '3.1', '3.3', '4.1', '4.2',
      '5.1', '5.3', '6.1', '6.3', '7.1', '7.3', '8.1',
      '9.1', '9.3', '10.1', '10.2', '11.1', '11.3', '12.1', '12.2',
      '13.1', '13.3', '14.1', '14.3', '15.1', '16.1', '16.2', '16.3'
    ]
  );

  character(
    '阿飞',
    'major',
    {
      aliases: ['飞剑客'],
      gender: '男',
      age: '二十上下',
      identity: '初入江湖的快剑少年',
      personality: '认准一个人就不再改，哪怕改了他也不肯认',
      appearance: '衣衫单薄，剑很快，话很少',
      base: '无（跟着李寻欢）',
      never: '绝不怀疑自己认准的人'
    },
    [
      '1.2', '1.3', '2.3', '3.3', '6.3', '7.2', '8.2', '8.3',
      '13.1', '13.2', '13.3', '14.2', '15.1', '15.2', '16.3'
    ]
  );

  character(
    '林诗音',
    'core',
    {
      aliases: ['林姑娘', '龙夫人'],
      gender: '女',
      identity: '李寻欢的表妹，龙啸云的妻子',
      personality: '什么都知道，什么都不说',
      appearance: '清瘦，话少，看人时眼睛不躲',
      base: '兴云庄',
      never: '绝不求李寻欢带她走'
    },
    ['4.2', '4.3', '5.3', '8.3', '16.3']
  );

  character(
    '龙啸云',
    'core',
    {
      aliases: ['龙庄主'],
      gender: '男',
      identity: '兴云庄庄主，李寻欢的结拜兄长',
      personality: '越怕被看穿，越要做得像个大侠',
      appearance: '身材魁梧，说话先笑',
      base: '兴云庄（原李园）',
      never: '绝不承认自己嫉妒李寻欢'
    },
    ['4.1', '4.2', '5.1', '5.3', '9.1', '9.2', '15.1']
  );

  character(
    '龙小云',
    'major',
    {
      gender: '男',
      age: '十余岁',
      identity: '龙啸云与林诗音之子',
      personality: '从不示弱，宁可先下手',
      appearance: '生得极好，眼神太老',
      base: '兴云庄',
      never: '绝不在人前认错'
    },
    ['3.2', '3.3', '4.1', '16.3']
  );

  character(
    '林仙儿',
    'core',
    {
      aliases: ['武林第一美人'],
      gender: '女',
      identity: '武林第一美人，梅花盗一案的幕后主使',
      personality: '把人心当筹码，从不动真的',
      appearance: '美得让人不敢直视',
      base: '无固定（处处都有她的地方）',
      never: '绝不承认自己输给谁'
    },
    ['5.2', '6.3', '8.2', '13.2', '15.1', '15.3']
  );

  character(
    '上官金虹',
    'core',
    {
      aliases: ['龙凤环', '金钱帮帮主'],
      gender: '男',
      identity: '金钱帮帮主，兵器谱第二',
      personality: '只信自己算得出的东西',
      appearance: '不高，很瘦，手上戴着一对金环',
      base: '金钱帮总舵',
      never: '绝不接受「接不住」这件事'
    },
    ['9.3', '11.3', '14.3', '15.1', '15.3', '16.2']
  );

  character(
    '荆无命',
    'major',
    {
      gender: '男',
      identity: '上官金虹的影子，快剑',
      personality: '不问为什么，只问在哪里',
      appearance: '沉默，像一件兵器',
      base: '跟着上官金虹',
      never: '绝不违抗上官金虹'
    },
    ['9.3', '14.1', '14.2', '16.2']
  );

  character(
    '孙小红',
    'major',
    {
      gender: '女',
      age: '十八九',
      identity: '天机老人的孙女，说书的',
      personality: '想说什么就说什么，想了就去做',
      appearance: '眼睛很亮，说话的时候手会动',
      base: '跟着爷爷，住小店',
      never: '绝不因为李寻欢心里有别人就走开'
    },
    ['11.2', '11.3', '12.2', '16.2', '16.3']
  );

  character(
    '天机老人',
    'major',
    {
      aliases: ['孙老头', '孙白发', '天机棒'],
      gender: '男',
      age: '七十余',
      identity: '兵器谱第一，孙小红的爷爷',
      personality: '什么都看得透，就是放不下「第一」这两个字',
      appearance: '佝偻，寻常老头模样，手里一根木棒',
      base: '无固定（带着孙女说书）',
      never: '绝不在人前承认自己是天机老人'
    },
    ['11.2', '11.3', '16.1']
  );

  character(
    '郭嵩阳',
    'major',
    {
      aliases: ['铁剑', '嵩阳铁剑'],
      gender: '男',
      identity: '兵器谱第四，嵩阳铁剑',
      personality: '宁可死，也不肯欠人一句',
      appearance: '剑很重，人很直',
      base: '无（四处挑战）',
      never: '绝不接受别人替他安排怎么死'
    },
    ['9.3', '10.1', '10.2', '10.3', '14.1']
  );

  character(
    '百晓生',
    'major',
    {
      aliases: ['平湖百晓生', '武林智者'],
      gender: '男',
      identity: '《兵器谱》作者，人称武林智者',
      personality: '算得清天下人的名次，算不清自己',
      appearance: '文士打扮，说话很慢',
      base: '无（各处都请他）',
      never: '绝不承认自己排错过'
    },
    ['6.3', '7.1', '7.3']
  );

  character(
    '铁传甲',
    'func',
    {
      gender: '男',
      identity: '李寻欢的车夫、仆从',
      personality: '话少，认死理，主人说什么就是什么',
      appearance: '手上全是冻裂的口子',
      base: '跟着李寻欢',
      never: '绝不离开李寻欢'
    },
    ['1.1', '2.1', '4.1', '9.1']
  );

  character(
    '赵正义',
    'func',
    {
      aliases: ['铁面无私'],
      gender: '男',
      identity: '江湖上人人敬重的「铁面无私」',
      personality: '最会在大庭广众之下说公道话',
      appearance: '一身正气，衣裳永远整齐',
      base: '兴云庄一带',
      never: '绝不当面说不义的话'
    },
    ['5.1', '5.2']
  );

  character(
    '田七',
    'func',
    {
      aliases: ['一条棍棒压天下'],
      gender: '男',
      identity: '与赵正义同进同退的江湖人',
      personality: '跟着人多的地方站',
      appearance: '手里总拎着一根短棍',
      base: '兴云庄一带',
      never: '绝不第一个出头'
    },
    [5, 6]
  );

  character(
    '吕凤先',
    'func',
    {
      aliases: ['银戟温侯'],
      gender: '男',
      identity: '兵器谱第五',
      personality: '败了不认，认了就不再活',
      appearance: '戟擦得很亮，人却已经旧了',
      base: '无',
      never: '绝不当众认输'
    },
    ['14.3']
  );

  character(
    '蓝蝎子',
    'func',
    {
      gender: '女',
      identity: '关外来的女子，自称比伊哭更强',
      personality: '记仇，也记恩',
      appearance: '一身黑衣，手腕细得像一折就断',
      base: '无',
      never: '绝不欠人情不还'
    },
    ['12.1', '12.2', '12.3', '13.1']
  );

  character(
    '铃铃',
    'func',
    {
      aliases: ['林铃铃'],
      gender: '女',
      age: '十六七',
      identity: '梅林里住着的女孩',
      personality: '什么都好奇，什么都敢问',
      appearance: '梳两条辫子，跑起来很快',
      base: '梅林',
      never: '绝不说谎'
    },
    ['13.1']
  );

  // ---------------------------------------------------------------- 钩子

  const hook = (
    code: string,
    name: string,
    readerAsk: string,
    hardness: 'hard' | 'soft',
    rels: [number | string, Role][]
  ): Entity => {
    const e = addEntity({ type: 'hook', code, name, layer: '', data: { readerAsk, hardness } });
    for (const [key, role] of rels) addLink(e.id, key, role);
    return e;
  };

  hook('H1', '小李飞刀，例不虚发', '真的例不虚发吗？会不会有一次不中？', 'hard', [
    ['1.1', 'plant'],
    ['2.3', 'hint'],
    ['7.3', 'hint'],
    ['14.2', 'hint'],
    ['16.2', 'pay']
  ]);

  hook('H2', '李寻欢刻的木像', '他刻的是谁？为什么从不让人看？', 'hard', [
    ['1.1', 'plant'],
    ['4.3', 'hint'],
    ['13.1', 'hint'],
    ['16.3', 'pay']
  ]);

  hook('H3', '林诗音为什么嫁给龙啸云', '她自己愿意吗？李寻欢为什么让？', 'hard', [
    ['4.2', 'plant'],
    ['4.3', 'hint'],
    ['5.3', 'pay']
  ]);

  hook('H4', '梅花盗是谁', '被栽赃的是李寻欢，那真的梅花盗是谁？', 'hard', [
    ['2.2', 'plant'],
    ['5.2', 'hint'],
    ['6.3', 'hint'],
    ['8.1', 'pay']
  ]);

  hook('H5', '阿飞的身世', '这个少年从哪来？他的剑是谁教的？', 'soft', [
    ['1.3', 'plant'],
    ['11.2', 'hint']
  ]);

  hook('H6', '沈浪与李家的旧约', '沈浪为什么把武功心法托给李家？阿飞和他是什么关系？', 'hard', [
    ['11.2', 'plant']
  ]);

  hook('H7', '兵器谱到底准不准', '排第一的，真打得过排第三的吗？', 'hard', [
    ['10.2', 'plant'],
    ['14.2', 'hint'],
    ['16.2', 'pay']
  ]);

  hook('H8', '上官金虹为什么一直不出手', '他明明能赢，为什么一直等？', 'hard', [
    ['11.3', 'plant'],
    ['14.2', 'hint'],
    ['16.2', 'pay']
  ]);

  hook('H9', '郭嵩阳为什么去送死', '他明知道会死，为什么还要去？', 'hard', [
    ['10.3', 'plant'],
    ['14.1', 'hint'],
    ['14.2', 'pay']
  ]);

  hook('H10', '林仙儿对阿飞有没有一点真心', '她哭的那一次，是真的还是演的？', 'soft', [
    ['5.2', 'plant'],
    ['15.3', 'hint']
  ]);

  hook('H11', '李寻欢的病', '他一直咳，这病会不会要他的命？', 'soft', [
    ['1.1', 'plant'],
    ['3.1', 'hint']
  ]);

  hook('H12', '孙小红的爷爷是谁', '这个爱吹牛的老头，凭什么让上官金虹退了一步？', 'hard', [
    ['11.2', 'plant'],
    ['11.3', 'pay']
  ]);

  hook('H13', '龙小云为什么恨李寻欢', '一个孩子，为什么第一次见面就想杀人？', 'hard', [
    ['3.3', 'plant'],
    ['4.1', 'hint'],
    ['16.3', 'pay']
  ]);

  // ---------------------------------------------------------------- 道具（只记外观与去向）

  const prop = (
    code: string,
    name: string,
    data: Entity['data'],
    rels: [number | string, Role][]
  ): Entity => {
    const e = addEntity({ type: 'prop', code, name, layer: '', data });
    for (const [key, role] of rels) addLink(e.id, key, role);
    return e;
  };

  prop(
    'P1',
    '小李飞刀',
    {
      propKind: '武器',
      appearance: '三寸七分长的一把小刀，薄得几乎看不见',
      origin: '从不离身，没人知道是谁打的',
      function: '只出一次；出一次就定生死',
      holder: '李寻欢'
    },
    [
      ['1.1', 'appear'],
      ['16.2', 'appear']
    ]
  );

  prop(
    'P2',
    '木像',
    {
      propKind: '信物',
      appearance: '巴掌大，刻的是个女子的侧脸',
      origin: '李寻欢在路上用小刀一刀一刀刻出来的',
      function: '他唯一不肯给人看的东西',
      holder: '李寻欢'
    },
    [
      ['1.1', 'appear'],
      ['4.3', 'appear'],
      ['13.1', 'appear']
    ]
  );

  prop(
    'P3',
    '金丝甲',
    {
      propKind: '器物',
      appearance: '薄如蝉翼的金丝软甲',
      origin: '金狮镖局护送之物',
      function: '第一场追杀因它而起，也第一次把「梅花盗」三个字带到李寻欢面前',
      holder: '金狮镖局（失窃，下落不明）'
    },
    [['2.1', 'appear']]
  );

  prop(
    'P4',
    '子母龙凤环',
    {
      propKind: '武器',
      appearance: '一母一子两只金环，小的藏在大的里面',
      origin: '上官金虹的成名兵器，兵器谱第二',
      function: '近身三丈之内，没有第二个人能站着',
      holder: '上官金虹'
    },
    [
      ['11.3', 'appear'],
      ['16.2', 'appear']
    ]
  );

  prop(
    'P5',
    '天机棒',
    {
      propKind: '武器',
      appearance: '一根看着像烧火棍的木棒',
      origin: '天机老人之物，兵器谱第一',
      function: '他不出手，它就只是一根棍子',
      holder: '天机老人'
    },
    [
      ['11.3', 'appear'],
      ['16.1', 'appear']
    ]
  );

  prop(
    'P6',
    '嵩阳铁剑',
    {
      propKind: '武器',
      appearance: '又宽又重，剑身有旧痕',
      origin: '郭嵩阳的家传剑',
      function: '兵器谱第四；他死后留在泉水旁',
      holder: '郭嵩阳 → 死后留在泉水旁'
    },
    [
      ['10.1', 'appear'],
      ['14.1', 'appear']
    ]
  );

  prop(
    'P7',
    '少林经书',
    {
      propKind: '器物',
      appearance: '藏经阁的旧经卷，函套上有火漆印',
      origin: '少林寺藏经阁',
      function: '有人为它盗经，少林的内乱因此露了底',
      holder: '少林藏经阁'
    },
    [['6.3', 'appear']]
  );

  // ---------------------------------------------------------------- 线

  const thread = (name: string, times: (number | string)[]): Entity => {
    const e = addEntity({ type: 'thread', code: '', name, layer: '', data: {} });
    for (const n of times) addLink(e.id, n, 'appear');
    return e;
  };

  thread('李寻欢与林诗音的旧情', ['4.2', '5.3', '8.3', '16.3']);
  thread('龙啸云的堕落', ['4.1', '5.1', '9.1', '15.1']);
  thread('阿飞的成长', ['1.3', '8.2', '13.3', '15.2', '16.3']);
  thread('金钱帮的扩张', ['9.3', '11.3', '14.3', '15.3', '16.2']);
  thread('兵器谱的秩序', ['10.2', '14.2', '16.2']);
  thread('林仙儿的操纵', ['5.2', '8.2', '13.2', '15.1']);
  thread('龙小云的恨', ['3.3', '4.1', '16.3']);

  // ---------------------------------------------------------------- 书

  // ---------------------------------------------------------------- 人物关系

  const idOf = (name: string): string =>
    entities.find((e) => e.type === 'character' && e.name === name)?.id ?? '';

  const rel = (
    a: string,
    b: string,
    label: string,
    from: string,
    to: string,
    at: number | null
  ) => ({
    id: uid(),
    aId: idOf(a),
    bId: idOf(b),
    label,
    from,
    to,
    changedAt: at === null ? null : chapterByNo.get(at)!,
    note: ''
  });

  // ---------------------------------------------------------------- 开工前的回答

  const ans = (questionId: string, text: string, state: Answer['state']): Answer => ({
    questionId,
    text,
    state,
    updatedAt: now
  });

  return {
    version: 4,
    book: {
      id: uid(),
      title: '多情剑客无情剑',
      genre: '武侠',
      targetWords: 600000,
      logline:
        '一个把未婚妻让给救命恩人的男人，十年后回到中原，发现自己那套「让」的活法，救不了任何人。',
      synopsis:
        '第一部：李寻欢入关，结识阿飞，被卷入梅花盗案。他被栽赃、被囚、被押上少林，最后查出幕后主使是林仙儿——而阿飞已经爱上了她。\n' +
        '第二部：两年后，一封匿名信把江湖人引到兴云庄。金钱帮浮出水面，郭嵩阳死，天机老人死，阿飞在林仙儿的迷药里废了两年。\n' +
        '收束：李寻欢设局让阿飞看清真相；天机老人替他挡下上官金虹；上官金虹死于自负。李寻欢与孙小红归隐。\n' +
        '三个段落各自闭环，一条暗线贯穿：把自己让出去，到底是慷慨，还是不肯欠人情的骄傲。',
      theme:
        '牺牲的代价。李寻欢从不问「我想要什么」，只问「我该让什么」——这本书要问的是：这种活法救人，还是害人。',
      notes:
        '按剧情段落重组为 16 章 / 48 节，不是原著回目（原著 90 章，分上中下三部）。\n' +
        '时间一律用相对表述：原著不标确切年份，硬填日期等于编。\n' +
        '人物字段里的「性格」和「绝不会做的事」是对文本的判断，不是原文摘录。',
      lastChapterId: chapterByNo.get(16)!,
      createdAt: now,
      updatedAt: now
    },
    chapters,
    entities,
    links,
    acks: [],
    settings: { c3Interval: 6, c4Stale: 6 },
    answers: [
      ans(
        'spine-lose',
        '他失去的是「让」这个活法。到最后他发现，让出去的东西不会因为让而变得更好，只会让接的人更沉。',
        'confirmed'
      ),
      ans(
        'spine-villain',
        '上官金虹。他谁都不欠——这正是问题所在：他不为任何人做事，动机得自己造。旧账那条线挂在兵器谱上，第一和第二。',
        'draft'
      ),
      ans(
        'spine-want-need',
        '想要：回到十年前，把林诗音拿回来。需要：承认当年那个决定不是慷慨，是骄傲。',
        'confirmed'
      ),
      ans('spine-truth', '梅花盗是林仙儿，龙啸云是同谋。瞒了整座江湖，也瞒了阿飞。', 'confirmed'),
      ans(
        'spine-wrong',
        '第三章，废了龙小云的武功。他以为在自保，其实是把一笔债种进了龙家。',
        'pending'
      ),
      ans(
        'spine-segments',
        '三案一条暗线：梅花盗案、兴云庄之宝、金钱帮。每个案子结尾死一个人。',
        'draft'
      ),
      ans(
        'spine-never',
        '李寻欢：不去要回已经让出去的东西。阿飞：不怀疑自己认准的人。龙啸云：不承认自己嫉妒。',
        'confirmed'
      ),
      ans('act1-change', '处境：从归人变成阶下囚。关系：阿飞站到了他对面。', 'confirmed'),
      ans('act1-reader', '木像是谁的。', 'draft')
    ],
    relations: [
      rel('李寻欢', '林诗音', '旧情', '相爱', '隔着身份，不再向前', 4),
      rel('李寻欢', '龙啸云', '结拜兄弟', '救命之恩', '反目', 5),
      rel('李寻欢', '阿飞', '朋友', '萍水相逢', '生死之交', 16),
      rel('李寻欢', '上官金虹', '对手', '无', '生死对决', 16),
      rel('李寻欢', '郭嵩阳', '对手', '不服', '知己', 10),
      rel('李寻欢', '孙小红', '情感', '无', '相守', null),
      rel('阿飞', '林仙儿', '情人', '迷恋', '幻灭', 15),
      rel('林诗音', '龙啸云', '夫妻', '夫妻', '夫妻（已空）', 5),
      rel('林仙儿', '上官金虹', '利用', '互相利用', '被抛弃', 15),
      rel('荆无命', '上官金虹', '主仆', '主仆', '主仆', null)
    ],
    world: [
      {
        id: uid(),
        category: '势力',
        title: '金钱帮',
        body: '帮主上官金虹。规矩只有一条：能用钱办的事，不动刀。帮里的人不称兄弟，只称职位。'
      },
      {
        id: uid(),
        category: '势力',
        title: '少林寺',
        body: '武林公认的正道之首。梅花盗案里，它既是审判的地方，也是被渗透的地方——这比任何反派都更让人不安。'
      },
      {
        id: uid(),
        category: '规则',
        title: '兵器谱',
        body: '平湖百晓生所排。不排女子，不排魔道。谱上有名的人走到哪里都被认出来——这既是荣耀，也是麻烦。\n前三：天机棒、子母龙凤环、小李飞刀。'
      },
      {
        id: uid(),
        category: '规则',
        title: '名次的代价',
        body: '谱上的名次不是荣誉，是靶子。吕凤先不服第五，郭嵩阳不服第四，两个人一辈子都在找排在自己前面的人。'
      },
      {
        id: uid(),
        category: '地理',
        title: '兴云庄（原李园）',
        body: '李寻欢的家。他出关后归了龙啸云。一草一木都没改，改的是主人——所以李寻欢走进去的时候，是最难受的那种「没变」。'
      },
      {
        id: uid(),
        category: '地理',
        title: '梅林',
        body: '阿飞与林仙儿隐居的地方。梅花开的时候很好看，屋子里的灯总是暗的。'
      },
      {
        id: uid(),
        category: '地理',
        title: '孙驼子的小店',
        body: '兴云庄附近的一间破店。李寻欢在这里喝了一年酒，江湖人也在这里重新聚起来。'
      },
      {
        id: uid(),
        category: '事件',
        title: '梅花盗案',
        body: '多年前就有的旧案，突然又起。死人、栽赃、押上少林——最后查出来，主使是那个「武林第一美人」。'
      },
      {
        id: uid(),
        category: '留白',
        title: '关外十年',
        body: '李寻欢把林诗音让出去之后，在关外待了十年。这十年书里几乎没写。\n这是一个必须做决定的空白：填、明说不写、还是标成预留。三种都行，只有「不知道」不行。'
      }
    ],
    map: {
      image: '',
      pins: [
        { id: uid(), x: 0.24, y: 0.44, name: '李园（兴云庄）', note: '故事开始的地方，也是回不去的地方' },
        { id: uid(), x: 0.52, y: 0.2, name: '少林寺', note: '梅花盗案的审判地，也是内奸藏身的地方' },
        { id: uid(), x: 0.76, y: 0.34, name: '金钱帮总舵', note: '上官金虹的地盘' },
        { id: uid(), x: 0.4, y: 0.66, name: '孙驼子小店', note: '李寻欢喝了一年酒的地方' },
        { id: uid(), x: 0.63, y: 0.72, name: '梅林', note: '阿飞与林仙儿隐居的地方' },
        { id: uid(), x: 0.12, y: 0.16, name: '关外', note: '十年空白。虚构坐标，只表示「很远」' }
      ]
    }
  };
}
