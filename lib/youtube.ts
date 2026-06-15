export interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function searchYouTube(query: string, maxResults = 10): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return [
      {
        id: "dQw4w9WgXcQ",
        title: `${query} — Demo Result (set YOUTUBE_API_KEY)`,
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        channel: "CrowdPlay Demo",
        duration: 212,
      },
    ];
  }

  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    key: apiKey,
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
    { next: { revalidate: 300 } }
  );

  if (!searchRes.ok) throw new Error("YouTube search failed");

  const searchData = await searchRes.json();
  const videoIds = (searchData.items ?? [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) return [];

  const detailsParams = new URLSearchParams({
    part: "contentDetails,snippet",
    id: videoIds,
    key: apiKey,
  });

  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${detailsParams}`,
    { next: { revalidate: 300 } }
  );

  if (!detailsRes.ok) throw new Error("YouTube details failed");

  const detailsData = await detailsRes.json();

  return (detailsData.items ?? []).map(
    (item: {
      id: string;
      snippet: { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } };
      contentDetails: { duration: string };
    }) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? "",
      channel: item.snippet.channelTitle,
      duration: parseDuration(item.contentDetails.duration),
    })
  );
}
