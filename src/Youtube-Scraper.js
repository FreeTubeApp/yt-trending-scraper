const requester = require('./TrendingRequester')
const htmlParser = require('./HtmlParser')
class YoutubeScraper {
  // starting point
  static async scrapeTrendingPage({ page = 'default', geoLocation = null, parseCreatorOnRise = false } = {}) {
    const requestData = await requester.requestTrendingPage(geoLocation, page)
    return htmlParser.parseNewHtml(requestData.data, parseCreatorOnRise)
  }
}
module.exports = YoutubeScraper
