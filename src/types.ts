export enum AttachmentType {
  MEDICAL = "medical",
  SOCIAL = "social"
}

export enum StorageType {
  SERVER = "server",
  DATABASE = "database"
}

export enum SecurityLevel {
  PUBLIC = "public",
  INTERNAL = "internal",
  CONFIDENTIAL = "confidential",
  RESTRICTED = "restricted"
}

export enum AttachmentStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  PENDING = "pending"
}

export interface AttachmentRecord {
  id: string;
  titleAr: string;
  titleEn: string;
  ownerName: string;
  ownerId: string;
  type: AttachmentType;
  classificationAr: string;
  classificationEn: string;
  storageType: StorageType;
  path: string;
  fileSizeKb: number;
  fileExtension: string;
  uploadedAt: string;
  securityLevel: SecurityLevel;
  status: AttachmentStatus;
  extractedNotesAr: string;
  extractedNotesEn: string;
  metadata: {
    clinicAr?: string;
    clinicEn?: string;
    doctorAr?: string;
    doctorEn?: string;
    associatedValue?: string; // income for social, measurements (e.g. blood sugar, hemoglobin) for medical
    socialWorkerAr?: string;
    socialWorkerEn?: string;
  };
}

export interface Dictionary {
  title: string;
  subtitle: string;
  dashboard: string;
  ingest: string;
  apiSandbox: string;
  langSelect: string;
  searchPlaceholder: string;
  filterAll: string;
  filterMedical: string;
  filterSocial: string;
  medical: string;
  social: string;
  server: string;
  database: string;
  storage: string;
  secLevel: string;
  status: string;
  active: string;
  archived: string;
  pending: string;
  public: string;
  internal: string;
  confidential: string;
  restricted: string;
  ownerName: string;
  ownerId: string;
  idCode: string;
  classification: string;
  path: string;
  fileSize: string;
  uploadedAt: string;
  notes: string;
  addRecord: string;
  editRecord: string;
  deleteRecord: string;
  save: string;
  cancel: string;
  aiExtractorTitle: string;
  aiExtractorDesc: string;
  aiRecommendBtn: string;
  aiProcessing: string;
  aiPlaceholder: string;
  statsTotal: string;
  statsMedical: string;
  statsSocial: string;
  statsServerPath: string;
  statsDbPath: string;
  apiDocTitle: string;
  apiDocDesc: string;
  apiResponse: string;
  apiEndpoint: string;
  apiMethod: string;
  apiTestBtn: string;
  apiDocsCodeSample: string;
  arabic: string;
  english: string;
  fileExtensionLabel: string;
  alertSuccess: string;
  alertError: string;
  noRecords: string;
  sampleInput1: string;
  sampleInput2: string;
  quickPaste: string;
  previewAttachment: string;
  viewRawFile: string;
  integrationMode: string;
  integrationModeDesc: string;
  simulateIframe: string;
}
