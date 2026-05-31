export type Finding = {
  id: string;
  type: string;
  category: 'shadow_ai' | 'pii_vulnerability' | 'data_collection' | 'injection' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  element?: string;
  evidence?: string;
  recommendation: string;
  ruleId?: string;
  message?: string;
  line?: number;
  filePath?: string;
};

export type ComplianceScanResult = {
  riskScore: number;
  findings: Finding[];
  rawFindings: Finding[];
  timestamp: string;
  url: string;
  scanDuration: number;
  testsRun: string[];
  isStaticScan: boolean;
  isBrowserScan: boolean;
  summary: string;
};

export type ComplianceFinding = Finding;
export type RepoFileMap = Record<string, string>;

export type StaticSignatureRule = {
  id?: string;
  regex: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  description: string;
};
