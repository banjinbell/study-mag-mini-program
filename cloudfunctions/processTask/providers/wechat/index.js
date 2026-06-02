const cloud = require('wx-server-sdk')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Referer': 'https://mp.weixin.qq.com/',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

function normalizeShareText(input) {
  const m = String(input).match(/https?:\/\/[^\s，。、,]+/)
  return m ? m[0] : String(input).trim()
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim()
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

async function fetchArticle(url) {
  const cleanUrl = normalizeShareText(url)
  const res = await fetch(cleanUrl, { headers: HEADERS, redirect: 'follow' })
  if (!res.ok) throw new Error(`公众号页面抓取失败: HTTP ${res.status}`)
  const html = await res.text()

  const titleRaw = (html.match(/<h1[^>]*id="activity-name"[^>]*>([\s\S]*?)<\/h1>/) || [])[1] ||
                   (html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/) || [])[1] || ''
  const authorRaw = (html.match(/<a[^>]*id="js_name"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || ''
  const contentRaw = (html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<script/) || [])[1] || ''

  console.log('[wechat] contentRaw length:', contentRaw.length, 'titleRaw length:', titleRaw.length)

  if (!contentRaw) throw new Error('未找到公众号正文（页面结构异常或链接失效）')

  const title = decodeEntities(stripTags(titleRaw))
  const author = decodeEntities(stripTags(authorRaw))

  const text = decodeEntities(
    contentRaw
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/(p|div|h[1-6]|li|blockquote|section)>/g, '\n')
      .replace(/<[^>]+>/g, '')
  ).replace(/\n{3,}/g, '\n\n').trim()

  const imgMatches = contentRaw.match(/(?:data-src|src)="(https:\/\/mmbiz\.qpic\.cn\/[^"]+)"/g) || []
  const images = [...new Set(imgMatches.map(m => m.replace(/^(?:data-src|src)="|"$/g, '')))]

  return { title, author, text, images, sourceUrl: cleanUrl }
}

async function uploadImages(imageUrls, taskId) {
  const results = await Promise.all(imageUrls.map(async (imgUrl, idx) => {
    const r = await fetch(imgUrl, { headers: { 'User-Agent': HEADERS['User-Agent'], 'Referer': HEADERS['Referer'] } })
    if (!r.ok) return null
    const buf = Buffer.from(await r.arrayBuffer())
    const cloudPath = `wechat/${taskId}/img_${String(idx).padStart(2, '0')}.jpg`
    const upload = await cloud.uploadFile({ cloudPath, fileContent: buf })
    return upload.fileID
  }))
  return results.filter(Boolean)
}

module.exports = { fetchArticle, uploadImages }
