const cloud = require('wx-server-sdk')

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Referer': 'https://www.xiaohongshu.com/',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

function normalizeShareText(input) {
  const m = String(input).match(/https?:\/\/[^\s，。、,]+/)
  return m ? m[0] : String(input).trim()
}

async function fetchImageUrls(noteUrl) {
  const url = normalizeShareText(noteUrl)
  const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' })
  if (!res.ok) throw new Error(`小红书页面抓取失败: HTTP ${res.status}`)
  const html = await res.text()
  const matches = html.match(/https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s)]+/g) || []
  const images = [...new Set(matches)]
  if (images.length === 0) {
    throw new Error('未在小红书页面中找到图片，可能是视频笔记或链接失效')
  }
  return images
}

async function downloadAndUpload(imageUrls, taskId) {
  const imgHeaders = { 'User-Agent': BROWSER_HEADERS['User-Agent'], 'Referer': BROWSER_HEADERS['Referer'] }
  const results = await Promise.all(imageUrls.map(async (imgUrl, idx) => {
    const r = await fetch(imgUrl, { headers: imgHeaders })
    if (!r.ok) throw new Error(`图片下载失败 [${idx}]: HTTP ${r.status}`)
    const buf = Buffer.from(await r.arrayBuffer())
    const cloudPath = `xhs/${taskId}/img_${String(idx).padStart(2, '0')}.jpg`
    const upload = await cloud.uploadFile({ cloudPath, fileContent: buf })
    return upload.fileID
  }))
  return results
}

async function fileIDsToHttpsUrls(fileIDs) {
  const { fileList } = await cloud.getTempFileURL({ fileList: fileIDs })
  return fileList.map(f => {
    if (f.status !== 0) throw new Error(`获取临时 URL 失败: ${f.errMsg}`)
    return f.tempFileURL
  })
}

module.exports = { fetchImageUrls, downloadAndUpload, fileIDsToHttpsUrls }
