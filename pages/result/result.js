const EPS = 1e-4;

const CATEGORY_META = {
  chaos: { label: '混沌', emoji: '🌪️', max: 3 },
  harmony: { label: '和谐', emoji: '🌈', max: 3 },
  ghost: { label: '幽灵', emoji: '👻', max: 4 },
};

function parseScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDescNumber(n) {
  return (Math.round(n * 1000) / 1000).toFixed(3);
}

function resolveSingle(key) {
  if (key === 'chaos') {
    return {
      title: '🌪️ 混沌兄弟连',
      desc: '你们的群聊永远是乱的，计划永远是假的，但感情是真的。',
    };
  }
  if (key === 'harmony') {
    return {
      title: '🌈 精神支柱团',
      desc: '你们是彼此的情绪价值担当，朋友圈里最暖的存在。',
    };
  }
  return {
    title: '👻 消失又回来型',
    desc: '你们平时各自人间蒸发，但一旦需要，秒变超级英雄。',
  };
}

function resolveHybrid(k1, k2) {
  const keys = new Set([k1, k2]);
  if (keys.has('chaos') && keys.has('ghost')) {
    return {
      title: '🌪️👻 混沌幽灵联盟',
      desc: '群里很热闹，人不一定在；消失得很突然，回来得很坦然。',
    };
  }
  if (keys.has('chaos') && keys.has('harmony')) {
    return {
      title: '🌪️🌈 真实可爱派',
      desc: '又暖又折腾，计划常翻车，但真诚从不缺席。',
    };
  }
  if (keys.has('harmony') && keys.has('ghost')) {
    return {
      title: '🌈👻 温柔消失系',
      desc: '平时各自潜水，关键时刻温柔上线，主打一个反差。',
    };
  }
  return {
    title: '🎭 友谊混搭型',
    desc: '你们的友情配方很罕见，建议原地出道。',
  };
}

function computeArchetype(chaos, harmony, ghost) {
  const rows = [
    { key: 'chaos', score: chaos },
    { key: 'harmony', score: harmony },
    { key: 'ghost', score: ghost },
  ];
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const s0 = sorted[0].score;
  const s1 = sorted[1].score;
  const s2 = sorted[2].score;

  if (Math.abs(s0 - s1) < EPS && Math.abs(s1 - s2) < EPS) {
    return {
      title: '🎭 友谊万花筒',
      desc: '三种气质在你们身上神奇持平——友情界的六边形战士。',
      variant: 'triple',
    };
  }

  if (Math.abs(s0 - s1) < EPS && s0 > s2 + EPS) {
    const hybrid = resolveHybrid(sorted[0].key, sorted[1].key);
    return { ...hybrid, variant: 'hybrid' };
  }

  const single = resolveSingle(sorted[0].key);
  return { ...single, variant: 'single' };
}

function buildBars(chaos, harmony, ghost) {
  const keys = ['chaos', 'harmony', 'ghost'];
  return keys.map((key) => {
    const meta = CATEGORY_META[key];
    const score = key === 'chaos' ? chaos : key === 'harmony' ? harmony : ghost;
    const cap = meta.max > 0 ? meta.max : 1;
    const percent = Math.min(100, Math.max(0, (score / cap) * 100));
    return {
      key,
      label: `${meta.emoji} ${meta.label}`,
      scoreText: formatDescNumber(score),
      percent,
    };
  });
}

Page({
  data: {
    groupSize: 4,
    chaos: 0,
    harmony: 0,
    ghost: 0,
    archetypeTitle: '',
    archetypeDesc: '',
    bars: [],
  },

  onLoad(options) {
    const groupSize = clampInt(options.groupSize, 2, 10);
    const chaos = parseScore(options.chaos);
    const harmony = parseScore(options.harmony);
    const ghost = parseScore(options.ghost);

    const app = getApp();
    app.globalData.groupSize = groupSize;
    app.globalData.scores = { chaos, harmony, ghost };

    const archetype = computeArchetype(chaos, harmony, ghost);
    const bars = buildBars(chaos, harmony, ghost);

    this.setData({
      groupSize,
      chaos,
      harmony,
      ghost,
      archetypeTitle: archetype.title,
      archetypeDesc: archetype.desc,
      bars,
    });
  },

  onRetry() {
    wx.reLaunch({
      url: '/pages/index/index',
    });
  },
});

function clampInt(value, min, max) {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
