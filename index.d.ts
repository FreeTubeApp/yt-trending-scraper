declare module "@freetubeapp/yt-trending-scraper" {
  interface Thumbnail {
    quality: string
    url: string
    width: number
    height: number
  }
  interface Video {
    videoId: string,
    title: string,
    type: "video",
    author: string,
    authorId: string,
    authorUrl: string,
    videoThumbnails: Thumbnail[],
    description: string,
    viewCount: number,
    published: EpochTimeStamp,
    publishedText: string,
    lengthSeconds: number,
    timeText: string,
    liveNow: false,
    paid: false,
    premium: false,
    isUpcoming: false,
    isCreatorOnRise: boolean,
    isVerified: boolean,
    isVerifiedAuthor: boolean,
    isShort: boolean
  }
  interface TrendingPayload {
    geoLocation: string,
    parseCreatorOnRise: boolean,
    page: "default" | "music" | "gaming" | "movies"
  }
  class TrendingScraper {
    static scrapeTrendingPage(payload: TrendingPayload) : Promise<Video[]>
  }
  export default TrendingScraper
}
