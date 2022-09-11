class HtmlParser {
  static parseNewHtml(htmlData, parseCreatorOnRise) {
    // matches the special setup of the video elements
    const jsonDataRegex = /ytInitialData = (.+)?(;<\/script>)/
    const jsonObject = JSON.parse(htmlData.match(jsonDataRegex)[1])
    const jsonContent = jsonObject.contents.twoColumnBrowseResultsRenderer.tabs
      .find(e => e.tabRenderer.selected)
      .tabRenderer
      .content
    let contentArrayJSON
    if ('sectionListRenderer' in jsonContent) {
      contentArrayJSON = jsonContent.sectionListRenderer.contents
    } else if ('richGridRenderer' in jsonContent) {
      contentArrayJSON = jsonContent.richGridRenderer.contents
    }
    let videos = []
    const currentTime = Date.now()
    contentArrayJSON.forEach((data) => {
      if ('itemSectionRenderer' in data) {
        const videoList = this.buildApiOutput(data.itemSectionRenderer.contents[0].shelfRenderer.content, currentTime, parseCreatorOnRise)
        videos = [...videos, ...videoList]
      } else if ('richItemRenderer' in data) {
        videos.push(
          this.parseRichItemRenderer(data, currentTime)
        )
      } else if ('richSectionRenderer' in data) {
        const videoList = this.parseRichSectionRenderer(data, currentTime)
        videos = [...videos, ...videoList]
      }
    })
    return this.deduplicateVideoList(videos)
  }

  static deduplicateVideoList(videos) {
    const uniqueIds = new Set()
    return videos.filter((video) => {
      if (!uniqueIds.has(video.videoId)) {
        uniqueIds.add(video.videoId)
        return true
      }
      return false
    })
  }

  // access the one video container and build and object with all the data required
  static buildApiOutput(videoList, currentTime, parseCreatorOnRise) {
    if ('horizontalListRenderer' in videoList && parseCreatorOnRise) {
      // we have a creator on the rise element with other structure
      return this.parseHorizontalVideoSection(videoList.horizontalListRenderer.items, currentTime)
    } else if ('expandedShelfContentsRenderer' in videoList) {
      // normal video section
      return this.parseNormalVideoSection(videoList.expandedShelfContentsRenderer.items, currentTime)
    }
    return []
  }

  static parseHorizontalVideoSection(videoList, currentTime) {
    const videoEntryList = []
    videoList.forEach((videoRenderer) => {
      videoRenderer = videoRenderer.gridVideoRenderer
      videoEntryList.push(this.parseVideo(videoRenderer, currentTime))
    })
    return videoEntryList.map(videoEntry => {
      videoEntry.isCreatorOnRise = true
      return videoEntry
    })
  }

  static parseNormalVideoSection(videoList, currentTime) {
    const videoEntryList = []
    videoList.forEach((videoRenderer) => {
      videoRenderer = videoRenderer.videoRenderer
      videoEntryList.push(this.parseVideo(videoRenderer, currentTime))
    })
    return videoEntryList
  }

  static parseRichItemRenderer(data, currentTime) {
    return this.parseVideo(data.richItemRenderer.content.videoRenderer, currentTime)
  }

  static parseRichSectionRenderer(data, currentTime) {
    return data.richSectionRenderer.content.richShelfRenderer.contents.map(rsr => {
      return this.parseRichItemRenderer(rsr, currentTime)
    })
  }

  static parseVideo(videoRenderer, currentTime) {
    const videoEntry = {
      videoId: -1,
      title: '',
      type: 'video',
      author: '',
      authorId: '',
      authorUrl: '',
      videoThumbnails: [],
      description: '',
      viewCount: -1,
      published: -1,
      publishedText: '',
      lengthSeconds: -1,
      liveNow: false,
      paid: false,
      premium: false,
      isUpcoming: false,
      timeText: '',
      isCreatorOnRise: false,
      isVerified: false,
      isVerifiedArtist: false,
      isShort: false
    }
    videoEntry.videoId = videoRenderer.videoId
    videoEntry.title = videoRenderer.title.runs[0].text
    videoEntry.author = videoRenderer.shortBylineText.runs[0].text
    videoEntry.authorId = videoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId
    videoEntry.authorUrl = videoRenderer.shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url
    videoEntry.viewCount = this.calculateViewCount(videoRenderer.viewCountText.simpleText)
    videoEntry.publishedText = videoRenderer.publishedTimeText.simpleText
    videoEntry.published = this.calculatePublished(videoEntry.publishedText, currentTime)
    if (/\d/.test(videoRenderer.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.text.simpleText)) {
      videoEntry.timeText = videoRenderer.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.text.simpleText
      videoEntry.lengthSeconds = this.calculateLengthInSeconds(videoEntry.timeText)
    } else { // "SHORTS" text can be localized so if there's no number in duration, assume it's a short
      const lengthData = this.parseShortsLength(videoRenderer.title.accessibility.accessibilityData.label)
      videoEntry.lengthSeconds = lengthData.lengthSeconds
      videoEntry.timeText = lengthData.timeText
      videoEntry.isShort = true
    }
    videoEntry.videoThumbnails = this.extractThumbnailData(videoEntry.videoId)
    if ('ownerBadges' in videoRenderer) {
      videoEntry.isVerified = (videoRenderer.ownerBadges[0].metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_VERIFIED')
      videoEntry.isVerifiedArtist = (videoRenderer.ownerBadges[0].metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST')
    }
    // check whether the property is available, because there can be videos without description which won't have an empty property
    if ('descriptionSnippet' in videoRenderer) {
      videoEntry.description = videoRenderer.descriptionSnippet.runs[0].text
    }
    return videoEntry
  }

  // calculates the length of the video in seconds as a number from the string "hh:mm:ss"
  static calculateLengthInSeconds(lengthText) {
    let lengthSeconds = 0
    const hoursMinutesSeconds = lengthText.match(/(\d(\d)*)/g)
    // calculate the time in seconds for every entry
    for (let i = hoursMinutesSeconds.length - 1; i >= 0; i--) {
      lengthSeconds += Math.pow(60, (hoursMinutesSeconds.length - i - 1)) * hoursMinutesSeconds[i]
    }
    return lengthSeconds
  }

  // calculates the number of views from the corresponding string "xxx,xxx,xxx,xxx"
  static calculateViewCount(viewText) {
    let viewCount = 0
    const viewersThreeSplit = viewText.match(/(\d(\d)*)/g)
    for (let i = 0; i < viewersThreeSplit.length; i++) {
      viewCount = viewCount * 1000 + Number(viewersThreeSplit[i])
    }
    return viewCount
  }

  // calculates the rough timestamp of the release - very exact for minutes, medium exact for hours and loosy exact for days
  static calculatePublished(publishText, currentTime) {
    const timePublishedAgo = publishText.match(/(\d(\d)*)/g)
    let timeSpan
    if (publishText.indexOf('week') > -1) {
      // posted x weeks ago
      timeSpan = Number(timePublishedAgo[0]) * 24 * 360 * 1000 * 7
    } else if (publishText.indexOf('day') > -1) {
      // posted x days ago
      timeSpan = Number(timePublishedAgo[0]) * 24 * 360 * 1000
    } else if (publishText.indexOf('hour') > -1) {
      // posted x hours ago
      timeSpan = Number(timePublishedAgo[0]) * 360 * 1000
    } else {
      // posted x minutes ago, just in case
      timeSpan = Number(timePublishedAgo[0]) * 60 * 1000
    }
    return currentTime - timeSpan
  }

  // creates a list of dictionaries with the relevant data for the different thumbnails
  // TODO maxres.jpg does not load even tho it loads in invidious
  static extractThumbnailData(videoId) {
    // TODO: make customizable
    return [
      this.createThumbnailDictionary('maxres', `https://i.ytimg.com/vi/${videoId}/maxres.jpg`, 1280, 720),
      this.createThumbnailDictionary('maxresdefault', `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, 1280, 720),
      this.createThumbnailDictionary('sddefault', `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`, 640, 480),
      this.createThumbnailDictionary('high', `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, 480, 360),
      this.createThumbnailDictionary('medium', `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, 320, 180),
      this.createThumbnailDictionary('default', `https://i.ytimg.com/vi/${videoId}/default.jpg`, 120, 90),
      this.createThumbnailDictionary('start', `https://i.ytimg.com/vi/${videoId}/1.jpg`, 120, 90),
      this.createThumbnailDictionary('middle', `https://i.ytimg.com/vi/${videoId}/2.jpg`, 120, 90),
      this.createThumbnailDictionary('end', `https://i.ytimg.com/vi/${videoId}/3.jpg`, 120, 90),
    ]
  }

  static createThumbnailDictionary(quality, url, width, height) {
    return {
      quality: quality,
      url: url,
      width: width,
      height: height
    }
  }

  static parseShortsLength(accessibilityData) {
    // "accessibilityData format: {Video Title} {x} weeks ago {y} seconds {z} views - play Short
    // (text is different depending on location, ex: german ip = german text)
    let timeText = '0'
    let lengthSeconds = 0
    const numbersAndSpacesRegex = /[^0-9\s]/g
    const numbersOnly = accessibilityData.replace(numbersAndSpacesRegex, '').trim().split(' ').filter(number => {
      return number !== ''
    })
    // only care about seconds/minute, skip over view count
    lengthSeconds = parseInt(numbersOnly[numbersOnly.length - 2])
    if (lengthSeconds === 1) { // assume it's a minute and not a second
      lengthSeconds *= 60
      timeText = '1:00'
    } else {
      timeText = '0:' + (lengthSeconds.toString().padStart(2, '0'))
    }
    return { timeText, lengthSeconds }
  }
}
module.exports = HtmlParser
