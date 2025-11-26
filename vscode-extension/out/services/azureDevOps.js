"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureDevOpsService = void 0;
const vscode = __importStar(require("vscode"));
class AzureDevOpsService {
    getConfig() {
        const config = vscode.workspace.getConfiguration('pmCommandCenter');
        const organization = config.get('azureDevOps.organization');
        const project = config.get('azureDevOps.project');
        const token = config.get('azureDevOps.token');
        if (!organization || !project) {
            return null;
        }
        return { organization, project, token };
    }
    async fetch(url) {
        const config = this.getConfig();
        if (!config) {
            throw new Error('Azure DevOps not configured');
        }
        const headers = {
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
        return response.json();
    }
    isConfigured() {
        return this.getConfig() !== null;
    }
    async getWorkItems(state = 'all') {
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
        const queryResult = await this.fetch(`${baseUrl}/_apis/wit/wiql?api-version=7.0`);
        if (!queryResult.workItems || queryResult.workItems.length === 0) {
            return [];
        }
        // Fetch work item details
        const ids = queryResult.workItems.slice(0, 100).map(w => w.id).join(',');
        const itemsResult = await this.fetch(`${baseUrl}/_apis/wit/workitems?ids=${ids}&$expand=all&api-version=7.0`);
        return itemsResult.value || [];
    }
    async getBuilds() {
        const config = this.getConfig();
        if (!config) {
            return [];
        }
        const baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;
        const result = await this.fetch(`${baseUrl}/_apis/build/builds?api-version=7.0&$top=30`);
        return result.value || [];
    }
    async getIterations() {
        const config = this.getConfig();
        if (!config) {
            return [];
        }
        const baseUrl = `https://dev.azure.com/${config.organization}/${config.project}`;
        const result = await this.fetch(`${baseUrl}/_apis/work/teamsettings/iterations?api-version=7.0`);
        return result.value || [];
    }
}
exports.AzureDevOpsService = AzureDevOpsService;
//# sourceMappingURL=azureDevOps.js.map