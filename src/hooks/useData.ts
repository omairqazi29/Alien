import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import type { Task, CriteriaId, AIGrade, Exhibit } from '../types';
import { extractTextFromFile } from '../lib/ai';

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
  const [content, setContentState] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEvidence = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = await db.getEvidence(user.id, criteriaId);
      setContentState(data);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    }
    setLoading(false);
  }, [user, criteriaId]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const saveEvidence = useCallback(async (newContent: string) => {
    if (!user) return;
    setContentState(newContent);
    try {
      await db.setEvidence(user.id, criteriaId, newContent);
    } catch (error) {
      console.error('Failed to save evidence:', error);
    }
  }, [user, criteriaId]);

  return { content, setContent: saveEvidence, loading, reload: loadEvidence };
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

// Hook for criteria policy details (from DB)
export function useCriteriaPolicy(criteriaId: CriteriaId) {
  const [policyDetails, setPolicyDetails] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await db.getCriteriaPolicy(criteriaId);
        setPolicyDetails(data);
      } catch (error) {
        console.error('Failed to load criteria policy:', error);
      }
      setLoading(false);
    }
    load();
  }, [criteriaId]);

  return { policyDetails, loading };
}

// Hook for "Assume Evidence Exists" toggle state
export function useAssumeEvidenceExists(criteriaId: CriteriaId) {
  const { user } = useAuth();
  const [assumeExists, setAssumeExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await db.getAssumeEvidenceExists(user.id, criteriaId);
        setAssumeExists(data);
      } catch (error) {
        console.error('Failed to load assume evidence exists:', error);
      }
      setLoading(false);
    }
    load();
  }, [user, criteriaId]);

  const saveAssumeExists = useCallback(async (value: boolean) => {
    if (!user) return;
    setAssumeExists(value);
    try {
      await db.setAssumeEvidenceExists(user.id, criteriaId, value);
    } catch (error) {
      console.error('Failed to save assume evidence exists:', error);
    }
  }, [user, criteriaId]);

  return { assumeExists, setAssumeExists: saveAssumeExists, loading };
}

// Hook for exhibits (file uploads)
export function useExhibits(criteriaId: CriteriaId) {
  const { user } = useAuth();
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await db.getExhibits(user.id, criteriaId);
        setExhibits(data);
      } catch (error) {
        console.error('Failed to load exhibits:', error);
      }
      setLoading(false);
    }
    load();
  }, [user, criteriaId]);

  const uploadExhibit = useCallback(async (file: File, label: string) => {
    if (!user) return null;
    setUploading(true);
    try {
      const newExhibit = await db.uploadExhibit(user.id, criteriaId, file, label);
      setExhibits(prev => [...prev, newExhibit]);

      // Trigger text extraction in the background
      extractExhibitText(newExhibit);

      return newExhibit;
    } catch (error) {
      console.error('Failed to upload exhibit:', error);
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, criteriaId]);

  const extractExhibitText = useCallback(async (exhibit: Exhibit) => {
    try {
      // Get signed URL for the file
      const fileUrl = await db.getExhibitUrl(exhibit.file_path);
      if (!fileUrl) return;

      // Extract text from the file
      const extractedText = await extractTextFromFile(fileUrl, exhibit.file_type, exhibit.file_name);

      // Update the exhibit with extracted text
      await db.updateExhibitText(exhibit.id, extractedText);

      // Update local state
      setExhibits(prev =>
        prev.map(e => e.id === exhibit.id ? { ...e, extracted_text: extractedText } : e)
      );
    } catch (error) {
      console.error('Failed to extract text from exhibit:', error);
    }
  }, []);

  const updateLabel = useCallback(async (exhibitId: string, label: string) => {
    if (!user) return;
    setExhibits(prev =>
      prev.map(e => e.id === exhibitId ? { ...e, label } : e)
    );
    try {
      await db.updateExhibitLabel(exhibitId, label);
    } catch (error) {
      console.error('Failed to update exhibit label:', error);
    }
  }, [user]);

  const deleteExhibit = useCallback(async (exhibitId: string) => {
    if (!user) return;
    const exhibit = exhibits.find(e => e.id === exhibitId);
    if (!exhibit) return;

    setExhibits(prev => prev.filter(e => e.id !== exhibitId));
    try {
      await db.deleteExhibit(exhibitId, exhibit.file_path);
    } catch (error) {
      console.error('Failed to delete exhibit:', error);
    }
  }, [user, exhibits]);

  const getExhibitUrl = useCallback(async (filePath: string) => {
    return await db.getExhibitUrl(filePath);
  }, []);

  return {
    exhibits,
    loading,
    uploading,
    uploadExhibit,
    updateLabel,
    deleteExhibit,
    getExhibitUrl,
    extractExhibitText,
  };
}
