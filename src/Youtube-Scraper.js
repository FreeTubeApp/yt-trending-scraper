const fs = require("fs")
const requester = require("./TrendingRequester")
const cheerio = require('cheerio');


class YoutubeScraper {
    static scrape_trending_page() {
        requester.requestTrendingPage()
            .then((data) => this.data_receive_ok(data))
            .catch((error) => this.data_receive_failed(error))
    }

    static data_receive_ok(request_data){
        console.log(">Success requesting trending page");
        this.parse_html(request_data.data);
    }

    static data_receive_failed(error){
        console.log("ERROR", error);
    }

    static parse_html(html_data){
        //Thanks to cadence for the Regex expression
        const ytInitialData = (html_data.match(/^\s*window\["ytInitialData"\] = (\{.*\});$/m) || [])[1]
        //TODO Take a look whether a regex that directly filters out the videoRenderers is possible
        const yt_data_json = JSON.parse(ytInitialData);
        const video_section_renderers = yt_data_json.contents.
                                        twoColumnBrowseResultsRenderer.tabs[0].
                                        tabRenderer.content.sectionListRenderer.contents

        let videoRenderer = []
        for(let i = 0; i < video_section_renderers.length; i++){
            if(video_section_renderers.length === 4 && i === 1){
                continue;
            }
            // concatenation of the video renderers, which are not creator on the rise video renderers
            videoRenderer = [...videoRenderer, ...video_section_renderers[i].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items]
        }
        console.log(videoRenderer)
    }
}
module.exports = YoutubeScraper
