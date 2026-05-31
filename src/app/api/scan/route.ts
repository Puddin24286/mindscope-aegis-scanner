import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryForAnalysis, parseGitHubUrl } from '@/lib/github';
import { scanCompliance } from '@/lib/engine/compliance-scraper';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const payload = await request.json().catch(() => null);
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Missing request body payload.' }, { status: 400 });
        }

        const { repoUrl, fileMap, authUsername } = payload;
        if (!repoUrl && !fileMap) {
            return NextResponse.json({ success: false, error: 'Must provide repoUrl or fileMap.' }, { status: 400 });
        }

        // 1. Direct Static File Ingestion Mode
        if (fileMap && typeof fileMap === 'object' && Object.keys(fileMap).length > 0) {
            const repoDetails = { name: 'file-map-scan', description: 'Static File Scan', size: 0, languages: { TypeScript: 100 } };
            const analysis = await scanCompliance(fileMap, repoDetails);
            return NextResponse.json({
                success: true,
                mode: 'static_direct',
                username: authUsername || 'local-scan',
                repository: { name: 'static-scan', url: 'file-map', description: 'Static analysis from direct upload.' },
                analysis: analysis
            }, { status: 200 });
        }

        // 2. Remote Pipeline Mode
        if (repoUrl) {
            if (!authUsername) {
                return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
            }

            const parsedTarget = parseGitHubUrl(repoUrl) as any;
            if (!parsedTarget) {
                return NextResponse.json({ success: false, error: 'Invalid GitHub URL target.' }, { status: 400 });
            }

            const repoNameString = typeof parsedTarget === 'string' ? parsedTarget : (parsedTarget.repo || 'Unknown-Repo');
            const repoData = await fetchRepositoryForAnalysis(authUsername, repoNameString) as any;
            
            if (!repoData) {
                return NextResponse.json({ success: false, error: 'Failed to ingest remote repository.' }, { status: 422 });
            }

            let filesArray: any[] | null = null;
            if (Array.isArray(repoData)) {
                filesArray = repoData;
            } else if (repoData && Array.isArray(repoData.files)) {
                filesArray = repoData.files;
            } else if (repoData && Array.isArray(repoData.repository?.files)) {
                filesArray = repoData.repository.files;
            }

            if (!filesArray) {
                return NextResponse.json({ success: false, error: 'No file manifest discovered.' }, { status: 422 });
            }

            const engineFileMap: Record<string, string> = {};
            filesArray.forEach((file: any) => {
                if (file && typeof file === 'object' && typeof file.path === 'string' && typeof file.content === 'string') {
                    engineFileMap[file.path] = file.content;
                }
            });

            const repoDetails = {
                name: (repoData && repoData.repository?.name) || repoNameString,
                languages: (repoData && repoData.languages) || { TypeScript: 100 },
                description: (repoData && repoData.repository?.description) || 'Aegis Managed Scan Target',
                size: filesArray.length * 512
            };

            const analysis = await scanCompliance(engineFileMap, repoDetails);
            return NextResponse.json({
                success: true,
                mode: 'remote_repo',
                username: authUsername,
                repository: { name: repoDetails.name, url: repoUrl, description: repoDetails.description },
                analysis: analysis
            }, { status: 200 });
        }

        return NextResponse.json({ success: false, error: "Invalid payload layout." }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Internal process fault.' }, { status: 500 });
    }
}
