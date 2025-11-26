import * as vscode from 'vscode';

interface GitHubMilestone {
    id: number;
    title: string;
    state: string;
    open_issues: number;
    closed_issues: number;
    due_on: string | null;
}

interface GitHubIssue {
    number: number;
    title: string;
    body: string | null;
    state: string;
    labels: Array<{ name: string }>;
    assignee: { login: string } | null;
    created_at: string;
    closed_at: string | null;
}

interface GitHubWorkflowRun {
    id: number;
    name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    created_at: string;
    html_url: string;
}

export class GitHubService {
    private async getToken(): Promise<string> {
        // Try to get token from VS Code's GitHub authentication
        try {
            const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: false });
            if (session) {
                return session.accessToken;
            }
        } catch (e) {
            // Fall through to config
        }

        // Fall back to configuration
        const config = vscode.workspace.getConfiguration('pmCommandCenter');
        const token = config.get<string>('github.token');
        if (!token) {
            throw new Error('GitHub authentication required. Please sign in to GitHub or set pmCommandCenter.github.token');
        }
        return token;
    }

    private async fetch<T>(url: string): Promise<T> {
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

        return response.json() as Promise<T>;
    }

    async getMilestones(owner: string, repo: string): Promise<GitHubMilestone[]> {
        return this.fetch<GitHubMilestone[]>(
            `https://api.github.com/repos/${owner}/${repo}/milestones?state=all&sort=due_on&direction=asc`
        );
    }

    async getOpenIssues(owner: string, repo: string, perPage: number = 100): Promise<GitHubIssue[]> {
        return this.fetch<GitHubIssue[]>(
            `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}`
        );
    }

    async getClosedIssues(owner: string, repo: string, perPage: number = 100): Promise<GitHubIssue[]> {
        const issues = await this.fetch<GitHubIssue[]>(
            `https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=${perPage}&sort=updated&direction=desc`
        );
        // Filter out PRs (they come through issues API too)
        return issues.filter(i => !('pull_request' in i));
    }

    async getWorkflowRuns(owner: string, repo: string): Promise<GitHubWorkflowRun[]> {
        const response = await this.fetch<{ workflow_runs: GitHubWorkflowRun[] }>(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=30`
        );
        return response.workflow_runs;
    }

    async getMilestoneIssues(owner: string, repo: string, milestoneNumber: number): Promise<GitHubIssue[]> {
        return this.fetch<GitHubIssue[]>(
            `https://api.github.com/repos/${owner}/${repo}/issues?milestone=${milestoneNumber}&state=all&per_page=100`
        );
    }
}
