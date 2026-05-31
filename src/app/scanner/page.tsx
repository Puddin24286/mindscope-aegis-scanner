'use client';

import { useState } from 'react';
import ResultsCard from '@/components/scanner/ResultsCard';
import type { ComplianceScanResult } from '@/types/compliance.dto';

export default function ScannerPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [fileMap, setFileMap] = useState<Record<string, string>>({});
    const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
    const [uiError, setUiError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState<ComplianceScanResult | null>(null);

    const processFiles = async (files: File[]) => {
        setUiError(null);
        const updatedMap = { ...fileMap };
        const updatedNames = [...uploadedFileNames];

        for (const file of files) {
            if (file.size > 250000) {
                setUiError(`File "${file.name}" rejected: Maximum single limit is 250KB.`);
                continue;
            }

            try {
                const textContent = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = () => reject(new Error("File processing interrupted."));
                    reader.readAsText(file);
                });

                updatedMap[file.name] = textContent;
                if (!updatedNames.includes(file.name)) updatedNames.push(file.name);
            } catch (err) {
                setUiError(`Failed to process local file content for: ${file.name}`);
            }
        }
        setFileMap(updatedMap);
        setUploadedFileNames(updatedNames);
    };

    const executeComplianceScan = async () => {
        if (Object.keys(fileMap).length === 0) return;
        setIsScanning(true);
        setUiError(null);

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileMap, authUsername: "local-ui-session" })
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) throw new Error(payload.error || "Gateway error.");
            setScanResults(payload.analysis);
        } catch (err: any) {
            setUiError(err.message || "An execution thread crashed.");
        } finally {
            setIsScanning(false);
        }
    };

    const clearWorkspace = () => {
        setFileMap({});
        setUploadedFileNames([]);
        setScanResults(null);
        setUiError(null);
    };

    return (
        <div className="min-h-screen bg-[#0D0D0D] text-slate-200 p-8 font-sans border border-zinc-900 diagnostic-grid">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="text-center border-b border-zinc-800 pb-6 mb-8">
                    <h1 className="text-4xl font-extrabold tracking-wider text-white">MINDSCOPE AEGIS</h1>
                    <p className="text-xs font-mono text-emerald-400 mt-2 tracking-widest uppercase">
                        Autonomous Integrity • Absolute Compliance Matrix
                    </p>
                </div>

                {!scanResults ? (
                    <div className="grid md:grid-cols-2 gap-8 bg-[#0A0A0A] p-8 border border-zinc-800 rounded-xl">
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Code Repository Scanning</h2>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={async (e) => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); }}
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                                    isDragging ? 'border-orange-500 bg-orange-950/10' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'
                                }`}
                            >
                                <p className="text-sm text-zinc-300">Drag and drop target files into this grid zone</p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-8">
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-white">Execution Workspace</h2>
                                {uploadedFileNames.length > 0 ? (
                                    <div className="bg-zinc-950/60 p-4 border border-zinc-800 rounded-lg space-y-2">
                                        <ul className="text-xs font-mono max-h-32 overflow-y-auto">
                                            {uploadedFileNames.map(name => <li key={name} className="text-emerald-400">✦ {name}</li>)}
                                        </ul>
                                    </div>
                                ) : <div className="text-xs font-mono text-zinc-600 p-8 rounded-lg text-center border border-zinc-900">CONSOLE STATE: IDLE</div>}
                            </div>
                            {uploadedFileNames.length > 0 && (
                                <button onClick={executeComplianceScan} disabled={isScanning} className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs py-3 rounded-lg tracking-widest uppercase font-bold shadow-lg">
                                    {isScanning ? "Scanning..." : "Initialize Compliance Scan"}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end"><button onClick={clearWorkspace} className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-lg">Reset</button></div>
                        <ResultsCard results={scanResults} />
                    </div>
                )}
            </div>
        </div>
    );
}
