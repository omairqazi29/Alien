import type { Task, CriteriaId, AIGrade } from '../types';

const STORAGE_KEYS = {
  SELECTED_CRITERIA: 'alien_selected_criteria',
  TASKS: 'alien_tasks',
  GRADES: 'alien_grades',
  EVIDENCE: 'alien_evidence',
};

export const storage = {
  getSelectedCriteria: (): CriteriaId[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_CRITERIA);
    return stored ? JSON.parse(stored) : [];
  },

  setSelectedCriteria: (criteria: CriteriaId[]): void => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CRITERIA, JSON.stringify(criteria));
  },

  getTasks: (): Task[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
  },

  setTasks: (tasks: Task[]): void => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  addTask: (task: Task): void => {
    const tasks = storage.getTasks();
    tasks.push(task);
    storage.setTasks(tasks);
  },

  updateTask: (taskId: string, updates: Partial<Task>): void => {
    const tasks = storage.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updated_at: new Date().toISOString() };
      storage.setTasks(tasks);
    }
  },

  deleteTask: (taskId: string): void => {
    const tasks = storage.getTasks().filter(t => t.id !== taskId);
    storage.setTasks(tasks);
  },

  getTasksByCriteria: (criteriaId: CriteriaId): Task[] => {
    return storage.getTasks().filter(t => t.criteria_id === criteriaId);
  },

  getGrades: (): AIGrade[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.GRADES);
    return stored ? JSON.parse(stored) : [];
  },

  setGrades: (grades: AIGrade[]): void => {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  },

  getGradeByCriteria: (criteriaId: CriteriaId): AIGrade | undefined => {
    return storage.getGrades().find(g => g.criteria_id === criteriaId);
  },

  setGradeByCriteria: (grade: AIGrade): void => {
    const grades = storage.getGrades().filter(g => g.criteria_id !== grade.criteria_id);
    grades.push(grade);
    storage.setGrades(grades);
  },

  // Evidence content (markdown) per criteria
  getAllEvidence: (): Record<string, string> => {
    const stored = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    return stored ? JSON.parse(stored) : {};
  },

  getEvidence: (criteriaId: CriteriaId): string => {
    const all = storage.getAllEvidence();
    return all[criteriaId] || '';
  },

  setEvidence: (criteriaId: CriteriaId, content: string): void => {
    const all = storage.getAllEvidence();
    all[criteriaId] = content;
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(all));
  },
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
