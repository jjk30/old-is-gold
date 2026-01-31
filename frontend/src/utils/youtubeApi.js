const YOUTUBE_API_KEY = 'AIzaSyCgh584NXa8KZp8-QH1H0E1zSnppgNhAsE'
const CACHE_KEY = 'youtube_video_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000

const FALLBACK_VIDEOS = {
  "Seated Arm Raises": "8BcPHWGQO44",
  "Ankle Circles": "8BcPHWGQO44",
  "Seated Marching": "8BcPHWGQO44",
  "Neck Stretches": "oZBR6V2MXWI",
  "Standing Leg Raises": "L0bHG-58M3I",
  "Wall Push-ups": "qP_6WklN9PA",
  "Heel-to-Toe Walk": "L0bHG-58M3I",
  "Seated Twists": "8BcPHWGQO44",
  "Calf Raises": "L0bHG-58M3I",
  "Squats with Chair": "qP_6WklN9PA",
  "Standing Marches": "L0bHG-58M3I",
  "Side Steps": "qP_6WklN9PA",
  "Arm Circles": "8BcPHWGQO44",
  "Standing Balance": "L0bHG-58M3I"
}

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) return data
    }
  } catch (e) { console.error('Cache error:', e) }
  return {}
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (e) { console.error('Cache error:', e) }
}

export async function searchExerciseVideo(exerciseName) {
  const cache = getCache()
  if (cache[exerciseName]) return cache[exerciseName]

  try {
    const query = encodeURIComponent(exerciseName + ' senior exercise tutorial')
    const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + query + '&type=video&maxResults=1&videoDuration=medium&key=' + YOUTUBE_API_KEY
    const response = await fetch(url)
    if (!response.ok) throw new Error('API failed')
    const data = await response.json()
    if (data.items && data.items.length > 0) {
      const video = data.items[0]
      const result = {
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high.url,
        channelTitle: video.snippet.channelTitle,
        isDefault: false
      }
      setCache({ ...cache, [exerciseName]: result })
      return result
    }
  } catch (error) { console.error('YouTube API error:', error) }
  
  const fallbackId = FALLBACK_VIDEOS[exerciseName] || '8BcPHWGQO44'
  return { videoId: fallbackId, title: exerciseName + ' Tutorial', thumbnail: 'https://img.youtube.com/vi/' + fallbackId + '/hqdefault.jpg', isDefault: true }
}

export function getThumbnailUrl(videoId) {
  return 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg'
}
