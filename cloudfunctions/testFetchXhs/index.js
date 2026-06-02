exports.main = async (event) => {
  const url = event.url
  if (!url) return { ok: false, error: 'missing url' }

  const isWechat = /mp\.weixin\.qq\.com/.test(url)
  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    'Referer': isWechat ? 'https://mp.weixin.qq.com/' : 'https://www.xiaohongshu.com/',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }

  try {
    const res = await fetch(url, { headers, redirect: 'follow' })
    const html = await res.text()

    if (isWechat) {
      const titleMatch = html.match(/<h1[^>]*id="activity-name"[^>]*>([\s\S]*?)<\/h1>/) || html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
      const authorMatch = html.match(/<a[^>]*id="js_name"[^>]*>([\s\S]*?)<\/a>/)
      const contentMatch = html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<script/)
      const contentHtml = contentMatch ? contentMatch[1] : ''
      const plainText = contentHtml
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<\/(p|div|h[1-6]|li|blockquote|section)>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim()
      const imgMatches = contentHtml.match(/data-src="([^"]+)"/g) || []
      const images = imgMatches.map(m => m.replace(/data-src="|"$/g, ''))

      return {
        ok: true,
        type: 'wechat',
        status: res.status,
        htmlSize: html.length,
        title: titleMatch ? titleMatch[1].trim() : null,
        author: authorMatch ? authorMatch[1].trim() : null,
        plainTextLength: plainText.length,
        plainTextHead: plainText.slice(0, 800),
        plainTextTail: plainText.slice(-300),
        imageCount: images.length,
        imagesHead: images.slice(0, 5)
      }
    }

    const imgRegex = /https?:\/\/sns-webpic-qc\.xhscdn\.com\/[^"'\s)]+/g
    const images = [...new Set(html.match(imgRegex) || [])]
    return {
      ok: true,
      type: 'xhs',
      status: res.status,
      htmlSize: html.length,
      imageCount: images.length,
      images
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
