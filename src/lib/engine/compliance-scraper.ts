import { calculateRiskScore, sortFindingsBySeverity } from '@/lib/utils/scoring';
import { ComplianceScanResult, ComplianceFinding, RepoFileMap, StaticSignatureRule } from '@/types/compliance.dto';

const STATIC_SIGNATURES: Array<StaticSignatureRule> = [
    {
        id: 'AEGIS-SEC-101',
        regex: /(const|let|var)\s+(\w*(key|secret|token|pass|auth)\w*)\s*=\s*['"`][a-zA-Z0-9\-_]{8,}['"`]/i,
        severity: 'CRITICAL',
        message: 'Hardcoded credentials or tokens detected (potential API key, secret, or hardcoded password pattern).',
        description: 'Matches pattern variables explicitly storing static authorization secrets.',
    },
    {
        id: 'AEGIS-SEC-202',
        regex: /(open|axios|fetch)\s*\[['\"]\s*local-api-endpoint['"].*?\)/gi,
        severity: 'HIGH',
        message: 'Insecure direct network wrapper usage detected. Internal API endpoints must pass through an official proxy/firewall.',
        description: 'Detects direct network calls to known un-firewalled internal routes.',
    },
    {
        id: 'AEGIS-AI-303',
        regex: /(new\s+(OpenAI|LangChain)\s*\(|clientInit)\s*\()/gi,
        severity: 'MEDIUM',
        message: 'Shadow AI model detected. Direct AI wrapper usage without explicit labeling or governance.',
        description: 'Matches unlabelled AI model initialization patterns.',
    }
];

export async function scanCompliance(fileStructureMap: RepoFileMap, repoDetails?: any): Promise<ComplianceScanResult> {
    console.log("--- Starting Static Analysis Scan (Fast Mode) ---");
    const allFindings: ComplianceFinding[] = [];

    if (!fileStructureMap || typeof fileStructureMap !== 'object') {
        return {
            riskScore: 100,
            findings: [],
            rawFindings: [],
            timestamp: new Date().toISOString(),
            url: 'static-scan',
            scanDuration: 0,
            testsRun: ['static_signatures'],
            isStaticScan: true,
            isBrowserScan: false,
            summary: 'Scan aborted: Invalid payload.'
        };
    }

    const fileStructureKeys = Object.keys(fileStructureMap);
    
    fileStructureKeys.forEach((fileStructureKey) => {
        const fileContent = fileStructureMap[fileStructureKey];
        if (typeof fileContent !== 'string') return;

        STATIC_SIGNATURES.forEach((signature) => {
            const matches = Array.from(fileContent.matchAll(signature.regex));
            
            matches.forEach((match) => {
                const lineIndex = match.index ? fileContent.substring(0, match.index).split('\n').length : 1;
                
                allFindings.push({
                    id: signature.id || 'AEGIS-STATIC',
                    ruleId: signature.id || 'AEGIS-STATIC',
                    type: 'static_violation',
                    category: 'security',
                    severity: (signature.severity || 'low').toLowerCase() as any,
                    message: signature.message,
                    description: signature.message,
                    recommendation: 'Refactor line blueprint configuration securely.',
                    line: lineIndex,
                    filePath: fileStructureKey
                });
            });
        });
    });

    const sorted = sortFindingsBySeverity(allFindings);
    const score = calculateRiskScore(sorted, allFindings);

    return {
        riskScore: score,
        findings: sorted,
        rawFindings: allFindings,
        timestamp: new Date().toISOString(),
        url: 'file-map',
        scanDuration: 120,
        testsRun: ['static_signatures'],
        isStaticScan: true,
        isBrowserScan: false,
        summary: `Static analysis completed across ${fileStructureKeys.length} files.`
    };
}
