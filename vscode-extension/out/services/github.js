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
exports.GitHubService = void 0;
const vscode = __importStar(require("vscode"));
class GitHubService {
    async getToken() {
        // Try to get token from VS Code's GitHub authentication
        try {
            const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: false });
            if (session) {
                return session.accessToken;
            }
        }
        catch (e) {
            // Fall through to config
        }
        // Fall back to configuration
        const config = vscode.workspace.getConfiguration('pmCommandCenter');
        const token = config.get('github.token');
        if (!token) {
            throw new Error('GitHub authentication required. Please sign in to GitHub or set pmCommandCenter.github.token');
        }
        return token;
    }
    async fetch(url) {
        const token = await this.getToken();
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'PM-Command-Center-VSCode'
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('GitHub authentication failed. Please check your token.');
            }
            if (response.status === 404) {
                throw new Error('Repository not found. Please check owner/repo settings.');
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        return response.json();
    }
    async getMilestones(owner, repo) {
        return this.fetch(`https://api.github.com/repos/${owner}/${repo}/milestones?state=all&sort=due_on&direction=asc`);
    }
    async getOpenIssues(owner, repo, perPage = 100) {
        return this.fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}`);
    }
    async getClosedIssues(owner, repo, perPage = 100) {
        const issues = await this.fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=${perPage}&sort=updated&direction=desc`);
        // Filter out PRs (they come through issues API too)
        return issues.filter(i => !('pull_request' in i));
    }
    async getWorkflowRuns(owner, repo) {
        const response = await this.fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=30`);
        return response.workflow_runs;
    }
    async getMilestoneIssues(owner, repo, milestoneNumber) {
        return this.fetch(`https://api.github.com/repos/${owner}/${repo}/issues?milestone=${milestoneNumber}&state=all&per_page=100`);
    }
}
exports.GitHubService = GitHubService;
//# sourceMappingURL=github.js.map