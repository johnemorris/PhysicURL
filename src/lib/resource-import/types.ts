export interface StoredResource {
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
  addedDate: string;
}

export type ResourceImportCandidate = Omit<StoredResource, 'id' | 'addedDate'>;

export interface ResourceImportIssue {
  field: string;
  code: 'required' | 'invalid' | 'unknown_taxonomy' | 'duplicate_upload' | 'duplicate_existing';
  message: string;
}

export interface ResourceImportRow {
  row: number;
  status: 'ready' | 'invalid';
  issues: ResourceImportIssue[];
  item?: ResourceImportCandidate;
}

export interface ResourceImportPreview {
  canImport: boolean;
  total: number;
  ready: number;
  invalid: number;
  rows: ResourceImportRow[];
  items: ResourceImportCandidate[];
}

export interface ResourceTaxonomy {
  sciences: Map<string, string>;
  subdisciplines: Map<string, Map<string, string>>;
  access: Set<string>;
  resourceTypes: Set<string>;
}
