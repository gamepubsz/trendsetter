const QUESTIONS = [
  {
    text: '你们中有多少人会在朋友生日当天才想起来发祝福？',
    category: 'chaos',
  },
  {
    text: '你们中有多少人在群里发消息但从不回复别人？',
    category: 'chaos',
  },
  {
    text: '你们中有多少人在出行时永远最后到？',
    category: 'chaos',
  },
  {
    text: '你们中有多少人会主动计划聚会？',
    category: 'harmony',
  },
  {
    text: '你们中有多少人记得朋友说过的小细节？',
    category: 'harmony',
  },
  {
    text: '你们中有多少人会在朋友难过时第一个出现？',
    category: 'harmony',
  },
  {
    text: '你们中有多少人有「我待会再回」但永远不回的习惯？',
    category: 'ghost',
  },
  {
    text: '你们中有多少人在朋友圈发了但不让你看？',
    category: 'ghost',
  },
  {
    text: '你们中有多少人会突然消失一个月再回来若无其事？',
    category: 'ghost',
  },
  {
    text: '你们中有多少人会在群里发表情包但从不说话？',
    category: 'ghost',
  },
];

function clampInt(value, min, max) {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function formatScoreParam(n) {
  return Number(n).toFixed(4);
}

Page({
  data: {
    groupSize: 4,
    total: QUESTIONS.length,
    index: 0,
    question: QUESTIONS[0],
    answer: 0,
    scores: { chaos: 0, harmony: 0, ghost: 0 },
    progressPercent: (1 / QUESTIONS.length) * 100,
    sliderMax: 4,
    nextLabel: '下一题',
    answerLabels: ['0 人'],
  },

  onLoad(options) {
    const parsed = clampInt(options.groupSize, 2, 10);
    const app = getApp();
    app.globalData.groupSize = parsed;
    const answerLabels = this.buildAnswerLabels(parsed);
    this.setData({
      groupSize: parsed,
      sliderMax: parsed,
      answerLabels,
      answer: 0,
    });
  },

  buildAnswerLabels(groupSize) {
    const labels = [];
    for (let i = 0; i <= groupSize; i += 1) {
      labels.push(`${i} 人`);
    }
    return labels;
  },

  onAnswerSliderChange(e) {
    const raw = Number(e.detail.value);
    const answer = clampInt(raw, 0, this.data.groupSize);
    this.setData({ answer });
  },

  onAnswerPickerChange(e) {
    const idx = Number(e.detail.value);
    const answer = clampInt(idx, 0, this.data.groupSize);
    this.setData({ answer });
  },

  applyCurrentAnswerToScores() {
    const { index, groupSize, scores, question } = this.data;
    const q = QUESTIONS[index];
    const answer = clampInt(this.data.answer, 0, groupSize);
    const ratio = groupSize > 0 ? answer / groupSize : 0;
    const nextScores = { ...scores };
    nextScores[q.category] += ratio;
    return { nextScores, ratio, answer };
  },

  onNext() {
    const { index, total, groupSize } = this.data;
    const { nextScores } = this.applyCurrentAnswerToScores();

    if (index >= total - 1) {
      const app = getApp();
      app.globalData.scores = nextScores;
      const chaos = formatScoreParam(nextScores.chaos);
      const harmony = formatScoreParam(nextScores.harmony);
      const ghost = formatScoreParam(nextScores.ghost);
      wx.navigateTo({
        url: `/pages/result/result?groupSize=${groupSize}&chaos=${chaos}&harmony=${harmony}&ghost=${ghost}`,
      });
      return;
    }

    const nextIndex = index + 1;
    const progressPercent = ((nextIndex + 1) / total) * 100;
    this.setData({
      scores: nextScores,
      index: nextIndex,
      question: QUESTIONS[nextIndex],
      answer: 0,
      progressPercent,
      nextLabel: nextIndex >= total - 1 ? '查看结果' : '下一题',
    });
  },
});
