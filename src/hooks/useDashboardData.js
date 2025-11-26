import { useState, useEffect } from 'react'
import { fetchDashboardData } from '../utils/github'
import { generateSampleData } from '../types/dashboard'

/**
 * Hook to fetch dashboard data from GitHub or fall back to sample data
 */
export function useDashboardData(owner, repo, token) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      // If we have GitHub credentials, try to fetch real data
      if (owner && repo && token) {
        try {
          const liveData = await fetchDashboardData(owner, repo, token)
          setData(liveData)
          setIsLive(true)
          setLoading(false)
          return
        } catch (err) {
          console.error('Failed to fetch GitHub data:', err)
          setError(err.message)
        }
      }

      // Fall back to sample data
      setData(generateSampleData())
      setIsLive(false)
      setLoading(false)
    }

    loadData()
  }, [owner, repo, token])

  const refresh = async () => {
    if (owner && repo && token) {
      setLoading(true)
      try {
        const liveData = await fetchDashboardData(owner, repo, token)
        setData(liveData)
        setIsLive(true)
        setError(null)
      } catch (err) {
        setError(err.message)
      }
      setLoading(false)
    }
  }

  return { data, loading, error, isLive, refresh }
}
