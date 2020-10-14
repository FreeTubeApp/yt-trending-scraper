const axios = require("axios")
const trending_page = "https://youtube.com/feed/trending"

class TrendingRequester {
    static async requestTrendingPage(geoLocation = null) {
        const config = {
            headers: {
                'x-youtube-client-name': '1',
                'x-youtube-client-version': '2.20180222',
                'accept-language': 'en-US,en;q=0.5'
            }
        }
        try {
            if (geoLocation !== null) {
                return await axios.get(trending_page+`?gl=${geoLocation}`, config)
            } else {
                return await axios.get(trending_page, config)
            }

        } catch (e) {
            return {
                error: true,
                message: e
            }
        }
    }
}
module.exports = TrendingRequester
