const util = require("util")
const requester = require("./TrendingRequester")

class YoutubeScraper {
    static scrape_trending_page() {
        requester.requestTrendingPage()
            .then((data) => this.data_receive_ok(data))
            .catch((error) => this.data_receive_failed(error))
    }

    static data_receive_ok(request_data){
        console.log(">Success requesting trending page")
        this.parse_html(request_data.data)
    }

    static data_receive_failed(error){
        console.log("ERROR")
    }

    static parse_html(html_data){
        console.log(html_data)
    }
}
module.exports = YoutubeScraper
