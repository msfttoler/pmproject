import * as vscode from 'vscode';

interface AzureDevOpsWorkItem {
    id: number;
    fields: {
        'System.Title': string;
        'System.State': string;
        'System.WorkItemType': string;
        'System.Description'?: string;
        'System.Tags'?: string;
        'System.AssignedTo'?: { displayName: string };
        'System.CreatedDate': string;
        'Microsoft.VSTS.Common.ClosedDate'?: string;
        'Microsoft.VSTS.Scheduling.StoryPoints'?: number;
    };
    _links?: {
        html?: { href: string };
    };
}

interface AzureDevOpsBuild {
    id: number;
    buildNumber: string;
    status: string;
    result: string;
    definition: { name: string };
    sourceBranch: string;
    requestedFor: { displayName: string };
    queueTime: string;
    finishTime?: string;
    _links?: {
        web?: { href: string };
    };
}

interface AzureDevOpsIteration {
    id: string;
    name: string;
    path: string;
    attributes?: {
        startDate?: string;
        finishDate?: string;
        timeFrame?: string;
    };
}

export class AzureDevOpsService {
    private getConfig() {
        const config = vscode.workspace.getConfiguration('pmCommandCenter');
        const organization = config.get<string>('azureDevOps.organization');
        const project = config.get<string>('azureDevOps.project');
        const token = config.get<string>('azureDevOps.token');

        if (!organization || !project) {
            return null;
        }

        return { organization, project, token };
    }

    private async fetch<T>(url: string): Promise<T> {
        const config = this.getConfig();
        if (!config) {
            throw new Error('Azure DevOps not configured');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (config.token) {
            const auth = Buffer.from(`:${config.token}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Azure DevOps authentication failed');
            }
            throw new Error(`Azure DevOps API error: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }

    isConfigured(): boolean {
        return this.getConfig() !== null;
    }

    async getWorkItems(state: 'open' | 'closed' | 'all' = 'all'): Promise<AzureDevOpsWorkItem[]> {
        const config = this.getConfig();
        if (!config) {
            return [];
        }

        const stateFilter = state === 'closed'
            ? "AND [System.State] IN ('Done', 'Closed', 'Resolved')"
            : state === 'open'
                ? "AND [System.State] NOT IN ('Done', 'Closed', 'Resolved')"
                : '';

        const wiql = {
            query: `SELECT [System.Id] FROM WorkItems 
                    WHERE [System.TeamProject] = '${config.project}' 
                    AND [System.WorkItemType] IN ('User Story', 'Bug', 'Task', 'Feature')
                    ${stateFilter}
                    ORDER BY [System.CreatedDate] DESC`
        };

        const baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;

        // Query for work item IDs
        const queryResult = await this.fetch<{ workItems: Array<{ id: number }> }>(
            `${baseUrl}/_apis/wit/wiql?api-version=7.0`
        );

        if (!queryResult.workItems || queryResult.workItems.length === 0) {
            return [];
        }

        // Fetch work item details
        const ids = queryResult.workItems.slice(0, 100).map(w => w.id).join(',');
        const itemsResult = await this.fetch<{ value: AzureDevOpsWorkItem[] }>(
            `${baseUrl}/_apis/wit/workitems?ids=${ids}&$expand=all&api-version=7.0`
        );

        return itemsResult.value || [];
    }

    async getBuilds(): Promise<AzureDevOpsBuild[]> {
        const config = this.getConfig();
        if (!config) {
            return [];
        }

        const baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;
        const result = await this.fetch<{ value: AzureDevOpsBuild[] }>(
            `${baseUrl}/_apis/build/builds?api-version=7.0&$top=30`
        );

        return result.value || [];
    }

    async getIterations(): Promise<AzureDevOpsIteration[]> {
        const config = this.getConfig();
        if (!config) {
            return [];
        }

        const baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;
        const result = await this.fetch<{ value: AzureDevOpsIteration[] }>(
            `${baseUrl}/_apis/work/teamsettings/iterations?api-version=7.0`
        );

        return result.value || [];
    }
}
