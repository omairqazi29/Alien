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

export interface CriteriaInfo {
  id: CriteriaId;
  name: string;
  officialTitle: string;
  description: string;
  examples: string[];
  keyGuidance: string;
  policyManualRef: string;
}

export interface Criteria extends Omit<CriteriaInfo, never> {
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
  exhibit?: string; // e.g., "A-1", "B-2" for petition reference
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

export type GradeLevel = 'strong' | 'moderate' | 'weak' | 'insufficient';

export interface ModelGrade {
  model: string;
  modelName: string;
  grade: GradeLevel;
  score: number; // 0-100
  feedback: string;
  suggestions: string[];
}

export interface AIGrade {
  id: string;
  criteria_id: CriteriaId;
  grades: ModelGrade[];
  graded_at: string;
}

export interface GitHubRepoConfig {
  id: number;
  full_name: string; // e.g., "owner/repo"
  name: string;
  stars_threshold?: number; // auto-complete task when stars reach this
  current_stars?: number;
  last_synced?: string;
}

export interface Exhibit {
  id: string;
  user_id: string;
  criteria_id: CriteriaId;
  label: string; // e.g., "A-1", "B-2"
  file_name: string;
  file_path: string; // path in storage bucket
  file_type: string; // MIME type
  file_size: number;
  extracted_text?: string; // text extracted from PDF/images
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  selected_criteria: CriteriaId[];
  criteria_evidence: Record<CriteriaId, string>; // markdown content per criterion
  github_username?: string;
  github_repos?: GitHubRepoConfig[]; // connected repos for tracking
  created_at: string;
  updated_at: string;
}

export const POLICY_MANUAL_URL = 'https://www.uscis.gov/policy-manual/volume-6-part-f-chapter-2';

export const EB1A_CRITERIA: CriteriaInfo[] = [
  {
    id: 'awards',
    name: 'Awards',
    officialTitle: 'Evidence of receipt of lesser nationally or internationally recognized prizes or awards for excellence',
    description: 'Prizes or awards for excellence in your field that are nationally or internationally recognized.',
    examples: [
      'Awards from well-known national institutions or professional associations',
      'Doctoral dissertation awards',
      'Awards for presentations at nationally/internationally recognized conferences',
      'Industry-specific excellence awards'
    ],
    keyGuidance: 'Focus is on personal receipt (team awards qualify if you appear on podium/stage or are specifically named). Consider award criteria, national/international significance, number of awardees, and competitor limitations. Local or employer-specific awards typically don\'t qualify.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'membership',
    name: 'Membership',
    officialTitle: 'Evidence of your membership in associations in the field which demand outstanding achievement of their members',
    description: 'Membership in associations that require outstanding achievement as judged by recognized experts.',
    examples: [
      'Professional association memberships with rigorous standards',
      'Fellowship in organizations requiring demonstrated excellence',
      'Fellow status in scientific societies based on sustained contributions'
    ],
    keyGuidance: 'The specific membership level must demonstrate expert judgment of outstanding achievement. General membership often insufficient. Factors that don\'t qualify alone: education level, years of experience, or fee payment.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'press',
    name: 'Published Material',
    officialTitle: 'Evidence of published material about you in professional or major trade publications or other major media',
    description: 'Published material about you and your specific work in the field.',
    examples: [
      'Professional or major print publications (newspaper articles, journal articles, books)',
      'Professional or major online publications',
      'Transcripts of professional or major audio/video coverage'
    ],
    keyGuidance: 'Material should be about your work, not just your employer\'s work. Must include title, date, author. Marketing materials you paid for don\'t qualify. Material mentioning you in team context qualifies if your significant role is documented.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'judging',
    name: 'Judging',
    officialTitle: 'Evidence that you have been asked to judge the work of others, either individually or on a panel',
    description: 'Acting as a judge of others\' work in same or allied field, with actual participation demonstrated.',
    examples: [
      'Peer reviewing for scholarly journals (with proof review was completed)',
      'Peer review of conference abstracts/papers',
      'Ph.D. dissertation committee membership',
      'Government research funding program peer review'
    ],
    keyGuidance: 'Documentation must show both invitation AND completion of judging work. Request letter plus evidence of completed review works well for journal peer review. Not just invitation—actual participation required.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'original_contribution',
    name: 'Original Contributions',
    officialTitle: 'Evidence of your original scientific, scholarly, artistic, athletic, or business-related contributions of major significance to the field',
    description: 'Original contributions that are of major significance to your field.',
    examples: [
      'Published materials about significance of your work',
      'Testimonials/letters about your original work',
      'Documentation of citations at level indicative of major significance',
      'Patents/licenses with evidence of commercial use or adoption'
    ],
    keyGuidance: 'Must demonstrate both originality AND major significance. Funding, patents, or publication alone insufficient. High citation rates relative to others and widespread field commentary support significance. Expert letters explaining contribution\'s nature and significance are valuable.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'scholarly_articles',
    name: 'Scholarly Articles',
    officialTitle: 'Evidence of your authorship of scholarly articles in professional or major trade publications or other major media',
    description: 'Authorship of scholarly articles reporting original research or philosophical discourse.',
    examples: [
      'Publications in peer-reviewed journals',
      'Published conference presentations at nationally/internationally recognized conferences',
      'Technical articles in major trade publications'
    ],
    keyGuidance: 'Scholarly articles are typically peer-reviewed with footnotes/bibliography. For non-academic fields, article must be written for "learned persons" with profound knowledge of field. Consider intended audience and circulation relative to other field media.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'exhibitions',
    name: 'Artistic Exhibitions',
    officialTitle: 'Evidence that your work has been displayed at artistic exhibitions or showcases',
    description: 'Your work product displayed at artistic exhibitions or showcases.',
    examples: [
      'Public showings at galleries or museums',
      'Art fairs and biennales',
      'Virtual or in-person artistic venues'
    ],
    keyGuidance: 'Regulation explicitly requires "artistic" exhibitions/showcases. Non-artistic exhibitions considered only as comparable evidence. Virtual or in-person venues acceptable.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'leading_role',
    name: 'Leading/Critical Role',
    officialTitle: 'Evidence of your performance of a leading or critical role in distinguished organizations',
    description: 'Leading or critical role for organizations with distinguished reputation.',
    examples: [
      'Senior faculty or senior research position at distinguished academic department',
      'Principal/named investigator for merit-based government awards (SBIR grants)',
      'Founder/co-founder contributing intellectual property to funded startup',
      'Key committee membership with demonstrated impact'
    ],
    keyGuidance: 'For "leading" role: title plus matching duties. For "critical" role: focus on performance significance, not title. Distinguished organization factors: media coverage, national rankings, government grants, significant VC/angel funding for startups.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'high_salary',
    name: 'High Salary',
    officialTitle: 'Evidence that you command a high salary or other significantly high remuneration in relation to others in the field',
    description: 'Salary or remuneration high relative to others in your field.',
    examples: [
      'Tax returns and pay statements',
      'Contract or job offer letter showing prospective salary',
      'Compensation surveys with geographical/position comparisons'
    ],
    keyGuidance: 'Use BLS wage data or Department of Labor CareerOneStop for comparisons. "Has commanded" includes credible prospective contracts/offers. Consider occupation descriptions, survey validity, location, and salary measurement method.',
    policyManualRef: POLICY_MANUAL_URL
  },
  {
    id: 'commercial_success',
    name: 'Commercial Success',
    officialTitle: 'Evidence of your commercial successes in the performing arts',
    description: 'Commercial success through box office receipts or sales volume in performing arts.',
    examples: [
      'Box office receipts documentation',
      'Record/CD/video sales figures',
      'Streaming numbers and revenue'
    ],
    keyGuidance: 'Mere recording release or performance participation insufficient. Volume of sales/receipts must show commercial success relative to similar performing arts practitioners. Focus on measurable sales metrics.',
    policyManualRef: POLICY_MANUAL_URL
  }
];
