const axios = require('axios')
const trendingPageBase = 'https://www.youtube.com/feed/trending'
const pageAdditions = {
  music: '4gINGgt5dG1hX2NoYXJ0cw%3D%3D',
  gaming: '4gIcGhpnYW1pbmdfY29ycHVzX21vc3RfcG9wdWxhcg%3D%3D',
  movies: '4gIKGgh0cmFpbGVycw%3D%3D'
}

class TrendingRequester {
  static async requestTrendingPage(geoLocation = null, page) {
    try {
      const params = {}
      if (geoLocation !== null) {
        params.persist_gl = 1
        params.gl = geoLocation
      }
      if (page !== 'default') {
        try {
          params.bp = pageAdditions[page]
        } catch (error) {
          console.error('Fallback to default trending page because no valid page name was provided:', page)
        }
      }
      return await axios.get(trendingPageBase, { params })
    } catch (e) {
      return {
        error: true,
        message: e
      }
    }
  }
}
module.exports = TrendingRequester
