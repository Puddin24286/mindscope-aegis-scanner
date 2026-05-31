'use client';

import type { ComplianceScanResult } from '@/types/compliance.dto';

interface ResultsCardProps {
  results: ComplianceScanResult;
}

export default function ResultsCard({ results }: ResultsCardProps) {
  const { riskScore, findings } = results;

  const getSeverityColor = (severity: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical': return 'text-orange-400 border-orange-950 bg-orange-950/30 font-semibold tracking-wide';
      case 'high': return 'text-orange-400 border-orange-900 bg-orange-950/40';
      case 'medium': return 'text-yellow-400 border-yellow-900 bg-yellow-950/30';
      default: return 'text-blue-400 border-blue-900 bg-blue-950/30';
    }
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-emerald-950/50 bg-emerald-950/5 p-8 rounded-xl text-center">
        <div className="text-6xl mb-4 text-emerald-400 font-mono">✚</div>
        <h2 className="text-2xl font-bold font-mono tracking-wide text-emerald-400">SECURITY POSTURE: SECURE</h2>
        <p className="text-xs font-mono text-emerald-300/70 mt-2">SUPPLY CHAIN INTEGRITY METRICS CONFIRMED CLEAN.</p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center bg-zinc-900/40 p-6 border border-zinc-800/60 rounded-xl">
        <div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Calculated Profile</span>
          <div className="text-4xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
            <span className={riskScore < 70 ? 'text-orange-500 animate-pulse' : 'text-emerald-400'}>{riskScore}</span>
            <span className="text-xs text-zinc-600 font-normal">/ 100 Risk Rating</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Threat Indicators</span>
          <span className="text-lg font-bold font-mono text-orange-400 block mt-1">{findings.length} Violations</span>
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-900 rounded-lg">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-900">
            <tr>
              <th className="p-4">RULE ID</th>
              <th className="p-4">LOCATION SIGNATURE</th>
              <th className="p-4">VULNERABILITY DESCRIPTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 bg-black/20">
            {findings.map((finding, idx) => (
              <tr key={idx} className="hover:bg-zinc-900/20 transition-colors">
                <td className="p-4 font-bold text-orange-400">{finding.ruleId || finding.id}</td>
                <td className="p-4 text-zinc-400">[{finding.filePath}]: Line <span className="text-white font-bold">{finding.line}</span></td>
                <td className="p-4"><div className={`p-2 border rounded-md ${getSeverityColor(finding.severity)}`}>{finding.message || finding.description}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
