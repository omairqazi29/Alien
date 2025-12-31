export type CriteriaId =
  | 'awards'
  | 'membership'
  | 'press'
  | 'judging'
  | 'original_contribution'
  | 'scholarly_articles'
  | 'exhibitions'
  | 'leading_role'
  | 'high_salary'
  | 'commercial_success';

export interface Criteria {
  id: CriteriaId;
  name: string;
  description: string;
  selected: boolean;
}

export type TaskType = 'manual' | 'sync';

export type SyncSource =
  | 'github_stars'
  | 'github_contributions'
  | 'google_scholar'
  | 'linkedin'
  | 'custom_api';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
  id: string;
  criteria_id: CriteriaId;
  title: string;
  description: string;
  type: TaskType;
  sync_source?: SyncSource;
  sync_config?: Record<string, string>;
  status: TaskStatus;
  evidence?: string;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

export type GradeLevel = 'strong' | 'moderate' | 'weak' | 'insufficient';

export interface AIGrade {
  id: string;
  criteria_id: CriteriaId;
  grade: GradeLevel;
  score: number; // 0-100
  feedback: string;
  suggestions: string[];
  graded_at: string;
}

export interface UserProfile {
  id: string;
  selected_criteria: CriteriaId[];
  criteria_evidence: Record<CriteriaId, string>; // markdown content per criterion
  created_at: string;
  updated_at: string;
}

export const EB1A_CRITERIA: Omit<Criteria, 'selected'>[] = [
  {
    id: 'awards',
    name: 'Awards',
    description: 'Documentation of receipt of lesser nationally or internationally recognized prizes or awards for excellence'
  },
  {
    id: 'membership',
    name: 'Membership',
    description: 'Documentation of membership in associations that require outstanding achievements of their members'
  },
  {
    id: 'press',
    name: 'Press',
    description: 'Published material about you in professional or major trade publications or other major media'
  },
  {
    id: 'judging',
    name: 'Judging',
    description: 'Evidence of participation as a judge of the work of others in your field'
  },
  {
    id: 'original_contribution',
    name: 'Original Contributions',
    description: 'Evidence of original scientific, scholarly, artistic, athletic, or business-related contributions of major significance'
  },
  {
    id: 'scholarly_articles',
    name: 'Scholarly Articles',
    description: 'Evidence of authorship of scholarly articles in professional journals or other major media'
  },
  {
    id: 'exhibitions',
    name: 'Exhibitions',
    description: 'Evidence of display of your work at artistic exhibitions or showcases'
  },
  {
    id: 'leading_role',
    name: 'Leading Role',
    description: 'Evidence of performing a leading or critical role in distinguished organizations'
  },
  {
    id: 'high_salary',
    name: 'High Salary',
    description: 'Evidence of commanding a high salary or remuneration relative to others in the field'
  },
  {
    id: 'commercial_success',
    name: 'Commercial Success',
    description: 'Evidence of commercial successes in the performing arts'
  }
];
