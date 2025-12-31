import { supabase } from './supabase';
import type { Task, CriteriaId, AIGrade } from '../types';

export const db = {
  // Profile / Criteria Selection
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getSelectedCriteria(userId: string): Promise<CriteriaId[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('selected_criteria')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching criteria:', error);
      return [];
    }
    return (data?.selected_criteria || []) as CriteriaId[];
  },

  async setSelectedCriteria(userId: string, criteria: CriteriaId[]): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ selected_criteria: criteria, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  },

  // Evidence Content
  async getEvidence(userId: string, criteriaId: CriteriaId): Promise<string> {
    const { data, error } = await supabase
      .from('profiles')
      .select('criteria_evidence')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching evidence:', error);
      return '';
    }
    return (data?.criteria_evidence as Record<string, string>)?.[criteriaId] || '';
  },

  async setEvidence(userId: string, criteriaId: CriteriaId, content: string): Promise<void> {
    // First get current evidence
    const { data } = await supabase
      .from('profiles')
      .select('criteria_evidence')
      .eq('id', userId)
      .single();

    const currentEvidence = (data?.criteria_evidence || {}) as Record<string, string>;
    currentEvidence[criteriaId] = content;

    const { error } = await supabase
      .from('profiles')
      .update({ criteria_evidence: currentEvidence, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  },

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return (data || []) as Task[];
  },

  async getTasksByCriteria(userId: string, criteriaId: CriteriaId): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('criteria_id', criteriaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return (data || []) as Task[];
  },

  async addTask(userId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        criteria_id: task.criteria_id,
        title: task.title,
        description: task.description,
        type: task.type,
        sync_source: task.sync_source,
        sync_config: task.sync_config,
        status: task.status,
        evidence: task.evidence,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  // AI Grades
  async getGrades(userId: string): Promise<AIGrade[]> {
    const { data, error } = await supabase
      .from('ai_grades')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching grades:', error);
      return [];
    }
    return (data || []) as AIGrade[];
  },

  async getGradeByCriteria(userId: string, criteriaId: CriteriaId): Promise<AIGrade | null> {
    const { data, error } = await supabase
      .from('ai_grades')
      .select('*')
      .eq('user_id', userId)
      .eq('criteria_id', criteriaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('Error fetching grade:', error);
      return null;
    }
    return data as AIGrade;
  },

  async setGrade(userId: string, grade: Omit<AIGrade, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('ai_grades')
      .upsert({
        user_id: userId,
        criteria_id: grade.criteria_id,
        grade: grade.grade,
        score: grade.score,
        feedback: grade.feedback,
        suggestions: grade.suggestions,
        graded_at: grade.graded_at,
      }, {
        onConflict: 'user_id,criteria_id'
      });

    if (error) throw error;
  },
};
