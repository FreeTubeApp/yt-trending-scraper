const requester = require("./TrendingRequester")


class YoutubeScraper {

    //starting point
    static async scrape_trending_page(geoLocation= null) {
        const request_data = await requester.requestTrendingPage(geoLocation);
        return this.parse_html(request_data.data);
    }

    //extract the required JSON object from the HTML data
    static parse_html(html_data){
        //TODO Take a look whether a regex that directly filters out the videoRenderers is possible
        //Thanks to cadence for the Regex expression
        const ytInitialData = (html_data.match(/^\s*window\["ytInitialData"\] = (\{.*\});$/m) || [])[1];

        //create a JSON object from the JSON string
        const yt_data_json = JSON.parse(ytInitialData);
        //extract the video containers
        const video_section_renderers = yt_data_json.contents.
                                        twoColumnBrowseResultsRenderer.tabs[0].
                                        tabRenderer.content.sectionListRenderer.contents;

        let videoRenderer = []
        for(let i = 0; i < video_section_renderers.length; i++){
            //check if the creator of the day is available and skip it - at the moment always section 2 and has 4 videos
            if(video_section_renderers.length === 4 && i === 1){
                continue;
            }
            // concatenation of the video renderers, which are not creator on the rise video renderers
            videoRenderer = [...videoRenderer, ...video_section_renderers[i].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items];
        }

        // get the current timestamp for calculating the published variable (is in milliseconds)
        const current_time = Date.now();
        let api_output = [];

        videoRenderer.forEach((element) => {
            api_output.push(this.build_api_output(element.videoRenderer, current_time));
        });
        return api_output;
    }

    //access the one video container and build and object with all the data required
    static build_api_output(videoRenderer, currentTime){
        let video_entry = {
            videoId: -1,
            title: "",
            type: "video",
            author: "",
            authorId: "",
            authorUrl: "",
            videoThumbnails: [],
            description: "",
            viewCount: -1,
            published: -1,
            publishedText: "",
            lengthSeconds: -1,
            liveNow: false,
            paid: false,
            premium: false,
            isUpcoming: false,
            timeText: ""
        };
        //access the relevant field of data an calculate missing values
        video_entry.videoId = videoRenderer.videoId;
        video_entry.title = videoRenderer.title.runs[0].text;
        video_entry.author = videoRenderer.longBylineText.runs[0].text;
        video_entry.authorId = videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId;
        video_entry.authorUrl = videoRenderer.longBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url;
        video_entry.viewCount = this.calculate_view_count(videoRenderer.viewCountText.simpleText);
        video_entry.publishedText = videoRenderer.publishedTimeText.simpleText;
        video_entry.published = this.calculate_published(video_entry.publishedText, currentTime);
        video_entry.timeText = videoRenderer.lengthText.simpleText;
        video_entry.lengthSeconds = this.calculate_length_in_seconds(video_entry.timeText);
        video_entry.videoThumbnails = this.extract_thumbnail_data(video_entry.videoId);
        //check whether the property is available, because there can be videos without description which won't have an empty property
        if(videoRenderer.hasOwnProperty("descriptionSnippet")){
            video_entry.description = videoRenderer.descriptionSnippet.runs[0].text;
        }
        return video_entry;
    }

    //calculates the length of the video in seconds as a number from the string "hh:mm:ss"
    static calculate_length_in_seconds(lengthText){
        let length_seconds = 0;
        const hours_minutes_seconds = lengthText.match(/(\d(\d)*)/g);
        // calculate the time in seconds for every entry
        for(let i = hours_minutes_seconds.length-1; i >= 0; i--){
            length_seconds += Math.pow(60, (hours_minutes_seconds.length - i - 1)) * hours_minutes_seconds[i];
        }
        return length_seconds;
    }

    //calculates the number of views from the corresponding string "xxx,xxx,xxx,xxx"
    static calculate_view_count(viewText){
        let view_count = 0;
        const viewers_three_split = viewText.match(/(\d(\d)*)/g);
        for(let i = 0; i < viewers_three_split.length; i++){
            view_count = view_count * 1000 + Number(viewers_three_split[i]);
        }
        return view_count;
    }

    //calculates the rough timestamp of the release - very exact for minutes, medium exact for hours and loosy exact for days
    static calculate_published(publishText, currentTime){
        const time_published_ago = publishText.match(/(\d(\d)*)/g);
        let time_span;
        if(publishText.indexOf("day") > -1){
            // posted x days ago
            time_span = Number(time_published_ago[0]) * 24 * 360 * 1000;
        }else if(publishText.indexOf("hours") > -1){
            // posted x hours ago
            time_span = Number(time_published_ago[0]) * 360 * 1000;
        }else{
            // posted x minutes ago, just in case
            time_span = Number(time_published_ago[0]) * 60 * 1000;
        }
        return currentTime - time_span;
    }

    //creates a list of dictionaries with the relevant data for the different thumbnails
    //TODO maxres.jpg does not load even tho it loads in invidious
    static extract_thumbnail_data(videoId){
        //TODO: make customizable
        return [
            this.create_thumbnail_dictionary("maxres", `https://i.ytimg.com/vi/${videoId}/maxres.jpg`, 1280, 720),
            this.create_thumbnail_dictionary("maxresdefault", `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, 1280, 720),
            this.create_thumbnail_dictionary("sddefault", `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`, 640, 480),
            this.create_thumbnail_dictionary("high", `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, 480, 360),
            this.create_thumbnail_dictionary("medium", `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, 320, 180),
            this.create_thumbnail_dictionary("default", `https://i.ytimg.com/vi/${videoId}/default.jpg`, 120, 90),
            this.create_thumbnail_dictionary("start", `https://i.ytimg.com/vi/${videoId}/1.jpg`, 120, 90),
            this.create_thumbnail_dictionary("middle", `https://i.ytimg.com/vi/${videoId}/2.jpg`, 120, 90),
            this.create_thumbnail_dictionary("end", `https://i.ytimg.com/vi/${videoId}/3.jpg`, 120, 90),
        ];
    }

    static create_thumbnail_dictionary(Quality, Url, Width, Height){
        return{
            quality: Quality,
            url: Url,
            width: Width,
            height: Height
        };
    }
}
module.exports = YoutubeScraper
