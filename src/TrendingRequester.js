const axios = require("axios")
const trending_page = "https://youtube.com/feed/trending"

class TrendingRequester {
    static async requestTrendingPage() {
        const config = {
            headers: {
                'x-youtube-client-name': '1',
                'x-youtube-client-version': '2.20180222',
                'accept-language': 'en-US,en;q=0.5'
            }
        }
        try {
            return await axios.get(trending_page, config)
        } catch (e) {
            return {
                error: true,
                message: e
            }
        }
    }
}
module.exports = TrendingRequester
