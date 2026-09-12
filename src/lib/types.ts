export interface Resource {
  id: string;
  title: string;
  url: string;
  domain: string;
  description: string;
  science: string;
  subdiscipline: string;
  resourceType: string;
  access: string;
  rating: number | null;
  yearEstablished: string | number;
  tags: string[];
  isVerified: boolean;
  isCurated: boolean;
  featured: boolean;
  isAffiliate: boolean;
  addedDate?: string;
}

export interface ScienceConfig {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface SEOContent {
  intro: string;
  key_concepts: string[];
  faq: { q: string; a: string }[];
}

export interface TreeScience {
  slug: string;
  name: string;
  icon: string;
  count: number;
  subdisciplines: { name: string; slug: string; count: number }[];
}

export interface Submission {
  id: string;
  title: string;
  url: string;
  description: string;
  science: string;
  subdiscipline: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}
