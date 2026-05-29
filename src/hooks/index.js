import { useState, useEffect, useCallback, useRef } from 'react';
import { applicationService, memberService } from '../services/supabase';

export const useClubApplications = () => {
  const [appliedClubs, setAppliedClubs] = useState([]);
  const [memberClubs, setMemberClubs] = useState([]);
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

  const loadMemberClubs = useCallback(async () => {
    try {
      const result = await memberService.getMemberClubsByUserId('anonymous');
      if (result.data) {
        const clubIds = result.data.map(member => member.club_id);
        setMemberClubs(clubIds);
      }
    } catch (error) {
      console.error('Failed to load member clubs:', error);
    }
  }, []);

  const isApplied = useCallback((clubId) => {
    return appliedClubs.includes(clubId);
  }, [appliedClubs]);

  const isMember = useCallback((clubId) => {
    return memberClubs.includes(clubId);
  }, [memberClubs]);

  const canApply = useCallback((clubId) => {
    return !isApplied(clubId) && !isMember(clubId);
  }, [isApplied, isMember]);

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

  const joinClub = useCallback(async (clubId) => {
    try {
      // 将俱乐部添加到成员列表
      setMemberClubs(prev => [...prev, clubId]);
      // 从申请列表中移除
      setAppliedClubs(prev => prev.filter(id => id !== clubId));
    } catch (error) {
      console.error('Failed to join club:', error);
    }
  }, []);

  useEffect(() => {
    loadAppliedClubs();
    loadMemberClubs();
  }, [loadAppliedClubs, loadMemberClubs]);

  return {
    appliedClubs,
    memberClubs,
    isApplied,
    isMember,
    canApply,
    applyToClub,
    removeApplication,
    joinClub,
    loadAppliedClubs,
    loadMemberClubs,
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
