import { useState, useEffect, useCallback, useRef } from 'react';
import { applicationService } from '../services/supabase';

export const useClubApplications = () => {
  const [appliedClubs, setAppliedClubs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const loadAppliedClubs = useCallback(async () => {
    try {
      const result = await applicationService.getUserApplications('anonymous');
      if (result.data) {
        const clubIds = result.data.map(app => app.club_id);
        setAppliedClubs(clubIds);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const isApplied = useCallback((clubId) => {
    return appliedClubs.includes(clubId);
  }, [appliedClubs]);

  const applyToClub = useCallback(async (clubId) => {
    if (isApplying) return;
    
    setIsApplying(true);
    
    try {
      const result = await applicationService.applyToClub(clubId, 'anonymous');
      
      if (result.data && !result.alreadyApplied) {
        setAppliedClubs(prev => [...prev, clubId]);
      }
    } catch (error) {
      console.error('Failed to apply to club:', error);
    } finally {
      setIsApplying(false);
    }
  }, [isApplying]);

  const removeApplication = useCallback(async (clubId) => {
    try {
      setAppliedClubs(prev => prev.filter(id => id !== clubId));
    } catch (error) {
      console.error('Failed to remove application:', error);
    }
  }, []);

  useEffect(() => {
    loadAppliedClubs();
  }, [loadAppliedClubs]);

  return {
    appliedClubs,
    isApplied,
    applyToClub,
    removeApplication,
    isLoaded,
    isApplying
  };
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};