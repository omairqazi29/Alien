// Pre-defined tasks from EB-1A spreadsheet
// Run the SQL in Supabase to seed your tasks after creating an account

import type { CriteriaId, TaskStatus } from '../types';

interface SeedTask {
  criteria_id: CriteriaId;
  title: string;
  description: string;
  status: TaskStatus;
  exhibit?: string;
}

export const SEED_TASKS: SeedTask[] = [
  // Original Contributions - Mimir Project
  {
    criteria_id: 'original_contribution',
    title: 'Mimir Project - Commit code to GitHub',
    description: 'Push Mimir project code to public repository',
    status: 'completed',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Mimir Project - Get GitHub stars',
    description: 'Achieve significant star count on repository',
    status: 'in_progress',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Mimir Project - Publish to Medium',
    description: 'Write technical article about Mimir on Medium',
    status: 'not_started',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Mimir Project - Publish Journal Article',
    description: 'Submit and publish in peer-reviewed journal',
    status: 'not_started',
  },

  // Original Contributions - Sentinel Project
  {
    criteria_id: 'original_contribution',
    title: 'Sentinel Project - Commit code to GitHub',
    description: 'Push Sentinel project code to public repository',
    status: 'completed',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Sentinel Project - Get GitHub stars',
    description: 'Achieve significant star count on repository',
    status: 'in_progress',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Sentinel Project - Publish to Medium',
    description: 'Write technical article about Sentinel on Medium',
    status: 'not_started',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Sentinel Project - Publish Journal Article',
    description: 'Submit and publish in peer-reviewed journal',
    status: 'not_started',
  },

  // Press/Published Material - Major Media
  {
    criteria_id: 'press',
    title: 'TechBullion Article',
    description: 'Published article about your work in TechBullion',
    status: 'completed',
  },
  {
    criteria_id: 'press',
    title: 'NerdBot Coverage',
    description: 'Coverage of your work on NerdBot',
    status: 'completed',
  },

  // High Salary
  {
    criteria_id: 'high_salary',
    title: 'Amazon Employment Verification',
    description: 'Get employment verification letter from Amazon',
    status: 'not_started',
  },
  {
    criteria_id: 'high_salary',
    title: 'DOL Wage Comparison Data',
    description: 'Gather Department of Labor wage data for comparison',
    status: 'not_started',
  },
  {
    criteria_id: 'high_salary',
    title: 'Tax Returns Documentation',
    description: 'Compile tax returns showing high salary',
    status: 'not_started',
  },

  // Leading/Critical Role
  {
    criteria_id: 'leading_role',
    title: 'Amazon Senior Role Documentation',
    description: 'Document senior/lead role at Amazon with responsibilities',
    status: 'not_started',
  },
  {
    criteria_id: 'leading_role',
    title: 'ASCS CLM Project Lead Evidence',
    description: 'Evidence of leading the ASCS CLM project',
    status: 'not_started',
  },

  // Scholarly Articles
  {
    criteria_id: 'scholarly_articles',
    title: 'Medium Technical Articles',
    description: 'Compile list of published Medium articles',
    status: 'in_progress',
  },
  {
    criteria_id: 'scholarly_articles',
    title: 'Journal Publication',
    description: 'Submit and publish peer-reviewed journal article',
    status: 'not_started',
  },

  // Judging
  {
    criteria_id: 'judging',
    title: 'Peer Review Evidence',
    description: 'Gather evidence of peer reviewing work (if applicable)',
    status: 'not_started',
  },

  // Expert Letters (applies to multiple criteria)
  {
    criteria_id: 'original_contribution',
    title: 'Expert Letter - Colleague 1',
    description: 'Request recommendation letter from industry expert',
    status: 'not_started',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Expert Letter - Colleague 2',
    description: 'Request recommendation letter from another expert',
    status: 'not_started',
  },
  {
    criteria_id: 'original_contribution',
    title: 'Expert Letter - Academic',
    description: 'Request recommendation letter from academic expert',
    status: 'not_started',
  },
];

// SQL to insert these tasks (run in Supabase SQL Editor after getting your user_id)
export function generateInsertSQL(userId: string): string {
  const values = SEED_TASKS.map(task =>
    `('${userId}', '${task.criteria_id}', '${task.title.replace(/'/g, "''")}', '${task.description.replace(/'/g, "''")}', 'manual', '${task.status}'${task.exhibit ? `, '${task.exhibit}'` : ', NULL'})`
  ).join(',\n  ');

  return `
INSERT INTO tasks (user_id, criteria_id, title, description, type, status, exhibit)
VALUES
  ${values};
`;
}
