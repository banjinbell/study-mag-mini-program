// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/submit/index',
        text: '新建',
        en: 'NEW',
        iconPath: '/images/manga/icon-tab-new.svg',
        selectedIconPath: '/images/manga/icon-tab-new-active.svg'
      },
      {
        pagePath: '/pages/list/index',
        text: '档案',
        en: 'ARCHIVE',
        iconPath: '/images/manga/icon-tab-list.svg',
        selectedIconPath: '/images/manga/icon-tab-list-active.svg'
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        en: 'ME',
        iconPath: '/images/manga/icon-tab-me.svg',
        selectedIconPath: '/images/manga/icon-tab-me-active.svg'
      }
    ]
  },
  methods: {
    onSwitch(e) {
      const idx = e.currentTarget.dataset.index
      const item = this.data.list[idx]
      wx.switchTab({ url: item.pagePath })
    }
  }
})
