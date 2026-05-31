import { Finding } from '@/types/compliance.dto';

export const SEVERITY_ORDER: Record<string, number> = {
    critical: 0,
    CRITICAL: 0,
    high: 1,
    HIGH: 1,
    medium: 2,
    MEDIUM: 2,
    low: 3,
    LOW: 3,
};

export const RISK_MULTIPLIERS: Record<string, number> = {
    critical: 1.0,
    high: 2.5,
    medium: 1.0,
    low: 0.5,
};

export function calculateRiskScore(findings: Finding[], rawFindings: Finding[]): number {
    const critical = findings.filter(f => (f.severity || '').toLowerCase() === 'critical').length;
    const high = findings.filter(f => (f.severity || '').toLowerCase() === 'high').length;
    const medium = findings.filter(f => (f.severity || '').toLowerCase() === 'medium').length;
    const low = findings.filter(f => (f.severity || '').toLowerCase() === 'low').length;
    
    const maxScore = 100;
    const deductions = (critical * 25) + (high * 15) + (medium * 5) + (low * 2);
    const computedScore = maxScore - deductions;
    
    return Math.min(Math.max(computedScore, 0), 100);
}

export function sortFindingsBySeverity(findings: Finding[]): Finding[] {
    return [...findings].sort((a, b) => {
        const aKey = a.severity || 'low';
        const bKey = b.severity || 'low';
        return (SEVERITY_ORDER[aKey] ?? 3) - (SEVERITY_ORDER[bKey] ?? 3);
    });
}

const scoringService = { 
    calculateRiskScore, 
    sortFindingsBySeverity, 
    SEVERITY_ORDER, 
    RISK_MULTIPLIERS 
};

export default scoringService;
