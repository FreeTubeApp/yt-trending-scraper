const requester = require("./TrendingRequester")

class YoutubeScraper {

    //starting point
    static async scrape_trending_page({ page = 'default', geoLocation = null, parseCreatorOnRise = false } = {}) {
        const request_data = await requester.requestTrendingPage(geoLocation, page);
        return this.parse_new_html(request_data.data, parseCreatorOnRise);
    }

    static parse_new_html(html_data, parseCreatorOnRise) {
        // matches the special setup of the video elements
        let jsonContent = '{' + html_data.match(/"sectionListRenderer".+?(},"tab)/)[0]
        // remove the last chars in order to make it valid JSON
        jsonContent = jsonContent.substring(0, jsonContent.length-5)
        const contentArrayJSON = JSON.parse(jsonContent).sectionListRenderer.contents
        let videos = []
        const current_time = Date.now();
        contentArrayJSON.forEach((data) => {
            const videoList = this.build_api_output(data.itemSectionRenderer.contents[0].shelfRenderer.content, current_time, parseCreatorOnRise)
            videos = [...videos, ...videoList]
        })
        return videos
    }
    //access the one video container and build and object with all the data required
    static build_api_output(videoList, currentTime, parseCreatorOnRise){
        if ('horizontalListRenderer' in videoList && parseCreatorOnRise) {
            // we have a creator on the rise element with other structure
            return this.parse_horizontal_video_section(videoList.horizontalListRenderer.items, currentTime)
        } else if('expandedShelfContentsRenderer' in videoList) {
            // normal video section
            return this.parse_normal_video_section(videoList.expandedShelfContentsRenderer.items, currentTime)
        }
        return []
    }

    static parse_horizontal_video_section(videoList, currentTime) {
        const videoEntryList = []
        videoList.forEach((videoRenderer) => {
            videoRenderer = videoRenderer.gridVideoRenderer
            videoEntryList.push(this.parse_video(videoRenderer, currentTime));
        })
        return videoEntryList.map(video_entry => {
          video_entry.isCreatorOnRise = true
          return video_entry
        })
    }

    static parse_normal_video_section(videoList, currentTime) {
        const videoEntryList = []
        videoList.forEach((videoRenderer) => {
            videoRenderer = videoRenderer.videoRenderer
            videoEntryList.push(this.parse_video(videoRenderer, currentTime));
        })
        return videoEntryList
    }

    static parse_video(videoRenderer, currentTime) {
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
        timeText: "",
        isCreatorOnRise: false,
        isVerified: false,
        isVerifiedArtist: false,
        isShort: false
      };
      video_entry.videoId = videoRenderer.videoId;
      video_entry.title = videoRenderer.title.runs[0].text;
      video_entry.author = videoRenderer.shortBylineText.runs[0].text;
      video_entry.authorId = videoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;
      video_entry.authorUrl = videoRenderer.shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url;
      video_entry.viewCount = this.calculate_view_count(videoRenderer.viewCountText.simpleText);
      video_entry.publishedText = videoRenderer.publishedTimeText.simpleText;
      video_entry.published = this.calculate_published(video_entry.publishedText, currentTime);
      if (videoRenderer.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.text.simpleText === 'SHORTS') {
        const lengthData = this.parseShortsLength(videoRenderer.title.accessibility.accessibilityData.label)
        video_entry.lengthSeconds = lengthData.lengthSeconds
        video_entry.timeText = lengthData.timeText
        video_entry.isShort = true
      } else {
        video_entry.timeText = videoRenderer.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.text.simpleText;
        video_entry.lengthSeconds = this.calculate_length_in_seconds(video_entry.timeText);
      }
      video_entry.videoThumbnails = this.extract_thumbnail_data(video_entry.videoId);
      if ('ownerBadges' in videoRenderer) {
        video_entry.isVerified = (videoRenderer.ownerBadges[0].metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_VERIFIED')
        video_entry.isVerifiedArtist = (videoRenderer.ownerBadges[0].metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST')
    }
      //check whether the property is available, because there can be videos without description which won't have an empty property
      if(videoRenderer.hasOwnProperty("descriptionSnippet")){
          video_entry.description = videoRenderer.descriptionSnippet.runs[0].text;
      }
      return video_entry
    }

    //calculates the length of the video in seconds as a number from the string "hh:mm:ss"
    static calculate_length_in_seconds(lengthText){
        let length_seconds = 0;
        const hours_minutes_seconds = lengthText.match(/(\d(\d)*)/g);
        // calculate the time in seconds for every entry
        if (hours_minutes_seconds != null) {
          for(let i = hours_minutes_seconds.length-1; i >= 0; i--){
              length_seconds += Math.pow(60, (hours_minutes_seconds.length - i - 1)) * hours_minutes_seconds[i];
          }
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

    static parseShortsLength(accessibilityData) {
      let timeText = '0'
      let lengthSeconds = 0
      const shortsRegex = /(years?|months?|weeks?|days?|hours?|minutes?|seconds?) ago (\d*) (second|minute)/
      const regexMatch = accessibilityData.match(shortsRegex)
      if (regexMatch) {
        lengthSeconds = parseInt(regexMatch[2])
        timeText = '0:' + (lengthSeconds.toString().padStart(2,'0'))
        if (regexMatch[3] == 'minute') {
          lengthSeconds *= 60
          timeText = '1:00'
        }
      } else {
        const numbersAndSpacesRegex = /[^0-9\s]/g
        let numbersOnly = accessibilityData.replace(numbersAndSpacesRegex, '').trim().split(' ')
        if (numbersOnly.length >= 3) {
          lengthSeconds = numbersOnly[numbersOnly.length - 2]
          timeText = '0:' + (lengthSeconds.toString().padStart(2,'0'))
        }
      }
      return {timeText, lengthSeconds}
    }
}
module.exports = YoutubeScraper
