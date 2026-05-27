import { useState, useEffect, useCallback } from 'react'

export const useClubApplications = () => {
  const [appliedClubs, setAppliedClubs] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  const loadAppliedClubs = useCallback(() => {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available')
        setIsLoaded(true)
        return
      }
      
      const stored = localStorage.getItem('club_applications')
      if (stored) {
        const data = JSON.parse(stored)
        if (data && Array.isArray(data.appliedClubs)) {
          setAppliedClubs(data.appliedClubs)
        }
      }
    } catch (e) {
      console.error('Failed to load applications:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const saveAppliedClubs = useCallback((clubs) => {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available')
        return
      }
      
      const data = {
        appliedClubs: clubs,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('club_applications', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save applications:', e)
    }
  }, [])

  const isApplied = useCallback((clubId) => {
    return appliedClubs.includes(clubId)
  }, [appliedClubs])

  const applyToClub = useCallback((clubId) => {
    setAppliedClubs(prev => {
      if (!prev.includes(clubId)) {
        const updated = [...prev, clubId]
        saveAppliedClubs(updated)
        return updated
      }
      return prev
    })
  }, [saveAppliedClubs])

  useEffect(() => {
    loadAppliedClubs()
  }, [loadAppliedClubs])

  return {
    appliedClubs,
    isApplied,
    applyToClub,
    isLoaded
  }
}

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
