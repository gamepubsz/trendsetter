Page({
  data: {
    groupSize: 4,
    participantLabels: [],
    participantRange: [],
    pickerIndex: 2,
  },

  onLoad() {
    const participantRange = [];
    const participantLabels = [];
    for (let n = 2; n <= 10; n += 1) {
      participantRange.push(n);
      participantLabels.push(`${n} 人`);
    }
    const app = getApp();
    app.globalData.groupSize = 4;
    this.setData({
      participantRange,
      participantLabels,
      pickerIndex: 2,
      groupSize: 4,
    });
  },

  onParticipantChange(e) {
    const idx = Number(e.detail.value);
    const groupSize = this.data.participantRange[idx];
    const app = getApp();
    app.globalData.groupSize = groupSize;
    this.setData({
      pickerIndex: idx,
      groupSize,
    });
  },

  onStart() {
    const { groupSize } = this.data;
    const app = getApp();
    app.globalData.groupSize = groupSize;
    wx.navigateTo({
      url: `/pages/quiz/quiz?groupSize=${groupSize}`,
    });
  },
});
