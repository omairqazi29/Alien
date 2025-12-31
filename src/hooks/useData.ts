import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import type { Task, CriteriaId, AIGrade } from '../types';

// Hook for selected criteria
export function useSelectedCriteria() {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<CriteriaId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await db.getSelectedCriteria(user.id);
        setCriteria(data);
      } catch (error) {
        console.error('Failed to load criteria:', error);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const setSelectedCriteria = useCallback(async (newCriteria: CriteriaId[]) => {
    if (!user) return;
    setCriteria(newCriteria);
    try {
      await db.setSelectedCriteria(user.id, newCriteria);
    } catch (error) {
      console.error('Failed to save criteria:', error);
    }
  }, [user]);

  return { criteria, setCriteria: setSelectedCriteria, loading };
}

// Hook for tasks
export function useTasks(criteriaId?: CriteriaId) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = criteriaId
        ? await db.getTasksByCriteria(user.id, criteriaId)
        : await db.getTasks(user.id);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
    setLoading(false);
  }, [user, criteriaId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;
    try {
      const newTask = await db.addTask(user.id, taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      return null;
    }
  }, [user]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)
    );
    try {
      await db.updateTask(taskId, updates);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await db.deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [user]);

  return { tasks, loading, addTask, updateTask, deleteTask, reload: loadTasks };
}

// Hook for evidence
export function useEvidence(criteriaId: CriteriaId) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await db.getEvidence(user.id, criteriaId);
        setContent(data);
      } catch (error) {
        console.error('Failed to load evidence:', error);
      }
      setLoading(false);
    }
    load();
  }, [user, criteriaId]);

  const saveEvidence = useCallback(async (newContent: string) => {
    if (!user) return;
    setContent(newContent);
    try {
      await db.setEvidence(user.id, criteriaId, newContent);
    } catch (error) {
      console.error('Failed to save evidence:', error);
    }
  }, [user, criteriaId]);

  return { content, setContent: saveEvidence, loading };
}

// Hook for AI grades
export function useGrade(criteriaId: CriteriaId) {
  const { user } = useAuth();
  const [grade, setGrade] = useState<AIGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await db.getGradeByCriteria(user.id, criteriaId);
        setGrade(data);
      } catch (error) {
        console.error('Failed to load grade:', error);
      }
      setLoading(false);
    }
    load();
  }, [user, criteriaId]);

  const saveGrade = useCallback(async (newGrade: AIGrade) => {
    if (!user) return;
    setGrade(newGrade);
    try {
      await db.setGrade(user.id, newGrade);
    } catch (error) {
      console.error('Failed to save grade:', error);
    }
  }, [user]);

  return { grade, setGrade: saveGrade, loading };
}
