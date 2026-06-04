// The YouTube Data API key now lives server-side. We call our own Lambda
// (/youtube), which holds the billable key in an env var, instead of shipping
// it in the client bundle.
import { apiGet } from './api'

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
    const response = await apiGet('/youtube?q=' + encodeURIComponent(exerciseName))
    if (!response.ok) throw new Error('API failed')
    const video = await response.json()
    if (video && video.videoId) {
      const result = {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
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
