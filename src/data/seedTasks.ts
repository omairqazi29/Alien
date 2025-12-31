// Example tasks for EB-1A preparation
// These are generic examples - users should create their own specific tasks

import type { CriteriaId, TaskStatus } from '../types';

interface SeedTask {
  criteria_id: CriteriaId;
  title: string;
  description: string;
  status: TaskStatus;
  exhibit?: string;
}

// Generic example tasks - NOT personalized
export const SEED_TASKS: SeedTask[] = [
  // Original Contributions - Examples
  {
    criteria_id: 'original_contribution',
    title: 'Document Major Project',
    description: 'Document a significant project with measurable impact',
    status: 'not_started',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Gather Usage/Adoption Metrics',
    description: 'Collect metrics showing adoption of your work (users, downloads, citations, etc.)',
    status: 'not_started',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Expert Recommendation Letter',
    description: 'Request letter from industry expert attesting to your contributions',
    status: 'not_started',
  },

  // High Salary - Examples
  {
    criteria_id: 'high_salary',
    title: 'Employment Verification Letter',
    description: 'Obtain official letter confirming position and compensation',
    status: 'not_started',
  },
  {
    criteria_id: 'high_salary',
    title: 'Wage Comparison Data',
    description: 'Gather DOL or industry wage data for comparison',
    status: 'not_started',
  },

  // Leading Role - Examples
  {
    criteria_id: 'leading_role',
    title: 'Document Leadership Position',
    description: 'Document your role and responsibilities in distinguished organization',
    status: 'not_started',
  },
  {
    criteria_id: 'leading_role',
    title: 'Organizational Chart',
    description: 'Obtain org chart showing your position and reporting structure',
    status: 'not_started',
  },

  // Scholarly Articles - Examples
  {
    criteria_id: 'scholarly_articles',
    title: 'Compile Publication List',
    description: 'List all published articles, papers, or technical writing',
    status: 'not_started',
  },
  {
    criteria_id: 'scholarly_articles',
    title: 'Gather Citation Metrics',
    description: 'Document citations and readership metrics for your work',
    status: 'not_started',
  },

  // Press - Examples
  {
    criteria_id: 'press',
    title: 'Compile Media Coverage',
    description: 'Gather articles or coverage about you or your work',
    status: 'not_started',
  },

  // Judging - Examples
  {
    criteria_id: 'judging',
    title: 'Document Review Activities',
    description: 'Document peer review, judging, or evaluation roles',
    status: 'not_started',
  },

  // Awards - Examples
  {
    criteria_id: 'awards',
    title: 'Compile Awards List',
    description: 'List nationally/internationally recognized awards or prizes',
    status: 'not_started',
  },

  // Membership - Examples
  {
    criteria_id: 'membership',
    title: 'Document Professional Memberships',
    description: 'Document memberships in associations requiring outstanding achievement',
    status: 'not_started',
  },
];
