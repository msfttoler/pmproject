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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const github_1 = require("./services/github");
const azureDevOps_1 = require("./services/azureDevOps");
const estimation_1 = require("./services/estimation");
const PM_PARTICIPANT_ID = 'pm-command-center.pm';
function activate(context) {
    // Initialize services
    const github = new github_1.GitHubService();
    const azureDevOps = new azureDevOps_1.AzureDevOpsService();
    const estimator = new estimation_1.EstimationEngine();
    // Create the chat participant
    const pm = vscode.chat.createChatParticipant(PM_PARTICIPANT_ID, async (request, context, stream, token) => {
        const command = request.command;
        try {
            // Show progress
            stream.progress('Analyzing your project data...');
            if (command === 'release') {
                await handleReleaseCommand(request, stream, github, azureDevOps, token);
            }
            else if (command === 'estimate') {
                await handleEstimateCommand(request, stream, estimator, github, token);
            }
            else if (command === 'cicd') {
                await handleCICDCommand(request, stream, github, azureDevOps, token);
            }
            else if (command === 'gaps') {
                await handleGapsCommand(request, stream, github, azureDevOps, token);
            }
            else if (command === 'summary') {
                await handleSummaryCommand(request, stream, github, azureDevOps, token);
            }
            else {
                // No command - use natural language to determine intent
                await handleNaturalLanguage(request, context, stream, github, azureDevOps, estimator, token);
            }
            return { metadata: { command: command || 'chat' } };
        }
        catch (error) {
            stream.markdown(`❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            return { metadata: { command: 'error' } };
        }
    });
    // Set the icon
    pm.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
    // Register followup provider for suggestions
    pm.followupProvider = {
        provideFollowups(result, context, token) {
            const followups = [];
            if (result.metadata.command === 'release') {
                followups.push({
                    prompt: 'What issues are blocking the release?',
                    label: '🚧 Show blockers'
                });
                followups.push({
                    prompt: 'Show me the CI/CD status for this release',
                    command: 'cicd',
                    label: '🔧 Check pipelines'
                });
            }
            else if (result.metadata.command === 'cicd') {
                followups.push({
                    prompt: 'Why did the last build fail?',
                    label: '❌ Investigate failure'
                });
            }
            else if (result.metadata.command === 'estimate') {
                followups.push({
                    prompt: 'What similar stories have we completed?',
                    label: '📊 Show historical data'
                });
            }
            return followups;
        }
    };
    context.subscriptions.push(pm);
}
async function handleReleaseCommand(request, stream, github, azureDevOps, token) {
    stream.progress('Fetching milestone data...');
    const config = vscode.workspace.getConfiguration('pmCommandCenter');
    const owner = config.get('github.owner');
    const repo = config.get('github.repo');
    if (!owner || !repo) {
        stream.markdown(`⚠️ **GitHub not configured**\n\nPlease set your GitHub repository in settings:\n\`\`\`json\n"pmCommandCenter.github.owner": "your-org",\n"pmCommandCenter.github.repo": "your-repo"\n\`\`\``);
        return;
    }
    try {
        const milestones = await github.getMilestones(owner, repo);
        const openMilestones = milestones.filter(m => m.state === 'open');
        if (openMilestones.length === 0) {
            stream.markdown('📭 **No open milestones found**\n\nCreate a milestone in GitHub to track your release.');
            return;
        }
        stream.markdown('# 🚀 Release Readiness Report\n\n');
        for (const milestone of openMilestones.slice(0, 3)) {
            const total = milestone.open_issues + milestone.closed_issues;
            const progress = total > 0 ? Math.round((milestone.closed_issues / total) * 100) : 0;
            const progressBar = generateProgressBar(progress);
            stream.markdown(`## ${milestone.title}\n\n`);
            stream.markdown(`${progressBar} **${progress}%** complete\n\n`);
            stream.markdown(`- ✅ Closed: ${milestone.closed_issues}\n`);
            stream.markdown(`- 🔵 Open: ${milestone.open_issues}\n`);
            if (milestone.due_on) {
                const dueDate = new Date(milestone.due_on);
                const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const status = daysLeft < 0 ? '🔴 Overdue' : daysLeft <= 7 ? '🟡 Due soon' : '🟢 On track';
                stream.markdown(`- 📅 Due: ${dueDate.toLocaleDateString()} (${status})\n`);
            }
            stream.markdown('\n---\n\n');
        }
        // Risk assessment
        const atRisk = openMilestones.filter(m => {
            if (!m.due_on)
                return false;
            const daysLeft = Math.ceil((new Date(m.due_on).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const progress = (m.closed_issues / (m.open_issues + m.closed_issues)) * 100;
            return daysLeft < 7 && progress < 80;
        });
        if (atRisk.length > 0) {
            stream.markdown(`⚠️ **${atRisk.length} milestone(s) at risk** - due soon with less than 80% complete\n`);
        }
    }
    catch (error) {
        throw new Error(`Failed to fetch release data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function handleEstimateCommand(request, stream, estimator, github, token) {
    const storyText = request.prompt;
    if (!storyText.trim()) {
        stream.markdown('📝 **Please provide a user story to estimate**\n\nExample: `/estimate As a user, I want to add OAuth login so I can securely authenticate`');
        return;
    }
    stream.progress('Analyzing story complexity...');
    const config = vscode.workspace.getConfiguration('pmCommandCenter');
    const owner = config.get('github.owner');
    const repo = config.get('github.repo');
    // Try to load historical data if GitHub is configured
    if (owner && repo) {
        try {
            stream.progress('Learning from historical data...');
            const closedIssues = await github.getClosedIssues(owner, repo, 100);
            estimator.learnFromHistory(closedIssues);
        }
        catch (e) {
            // Continue with heuristics if historical data fails
        }
    }
    const estimate = estimator.estimate(storyText);
    stream.markdown(`# 🎯 Story Point Estimate\n\n`);
    stream.markdown(`**Story:** ${storyText}\n\n`);
    stream.markdown(`---\n\n`);
    stream.markdown(`## ${getPointsEmoji(estimate.points)} **${estimate.points} points** (${estimate.label})\n\n`);
    stream.markdown(`- 📅 Estimated days: ~${estimate.estimatedDays}\n`);
    stream.markdown(`- 🎚️ Confidence: ${estimate.confidence}%\n`);
    stream.markdown(`- 📊 Based on: ${estimate.basedOn}\n\n`);
    if (estimate.factors.length > 0) {
        stream.markdown(`### Complexity Factors\n\n`);
        for (const factor of estimate.factors) {
            stream.markdown(`- ${factor}\n`);
        }
    }
    if (estimate.warnings.length > 0) {
        stream.markdown(`\n### ⚠️ Warnings\n\n`);
        for (const warning of estimate.warnings) {
            stream.markdown(`- ${warning}\n`);
        }
    }
}
async function handleCICDCommand(request, stream, github, azureDevOps, token) {
    stream.progress('Fetching pipeline status...');
    const config = vscode.workspace.getConfiguration('pmCommandCenter');
    const owner = config.get('github.owner');
    const repo = config.get('github.repo');
    if (!owner || !repo) {
        stream.markdown(`⚠️ **GitHub not configured**\n\nPlease configure your repository in settings.`);
        return;
    }
    try {
        const runs = await github.getWorkflowRuns(owner, repo);
        const running = runs.filter(r => r.status === 'in_progress' || r.status === 'queued');
        const failed = runs.filter(r => r.conclusion === 'failure').slice(0, 5);
        const succeeded = runs.filter(r => r.conclusion === 'success').slice(0, 5);
        stream.markdown(`# 🔧 CI/CD Pipeline Status\n\n`);
        // Summary stats
        const successRate = runs.length > 0
            ? Math.round((runs.filter(r => r.conclusion === 'success').length / runs.length) * 100)
            : 0;
        stream.markdown(`| Metric | Value |\n|--------|-------|\n`);
        stream.markdown(`| 🔄 Running | ${running.length} |\n`);
        stream.markdown(`| ❌ Recent Failures | ${failed.length} |\n`);
        stream.markdown(`| ✅ Success Rate | ${successRate}% |\n\n`);
        // Currently running
        if (running.length > 0) {
            stream.markdown(`## 🔄 Currently Running\n\n`);
            for (const run of running) {
                stream.markdown(`- **${run.name}** on \`${run.head_branch}\` - started ${formatTimeAgo(run.created_at)}\n`);
            }
            stream.markdown('\n');
        }
        // Recent failures
        if (failed.length > 0) {
            stream.markdown(`## ❌ Recent Failures\n\n`);
            for (const run of failed) {
                stream.markdown(`- **${run.name}** on \`${run.head_branch}\` - ${formatTimeAgo(run.created_at)} - [View details](${run.html_url})\n`);
            }
            stream.markdown('\n');
        }
        // Recent successes
        if (succeeded.length > 0) {
            stream.markdown(`## ✅ Recent Successes\n\n`);
            for (const run of succeeded.slice(0, 3)) {
                stream.markdown(`- **${run.name}** on \`${run.head_branch}\` - ${formatTimeAgo(run.created_at)}\n`);
            }
        }
    }
    catch (error) {
        throw new Error(`Failed to fetch CI/CD data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function handleGapsCommand(request, stream, github, azureDevOps, token) {
    stream.progress('Analyzing issues for gaps...');
    const config = vscode.workspace.getConfiguration('pmCommandCenter');
    const owner = config.get('github.owner');
    const repo = config.get('github.repo');
    if (!owner || !repo) {
        stream.markdown(`⚠️ **GitHub not configured**`);
        return;
    }
    try {
        const issues = await github.getOpenIssues(owner, repo);
        const noLabels = issues.filter(i => !i.labels || i.labels.length === 0);
        const noAssignee = issues.filter(i => !i.assignee);
        const shortDescription = issues.filter(i => !i.body || i.body.length < 50);
        const noAcceptanceCriteria = issues.filter(i => i.body && !i.body.toLowerCase().includes('acceptance criteria') &&
            !i.body.toLowerCase().includes('given') &&
            !i.body.toLowerCase().includes('expected'));
        stream.markdown(`# 🔍 Story Gap Analysis\n\n`);
        stream.markdown(`Analyzed **${issues.length}** open issues\n\n`);
        stream.markdown(`| Gap Type | Count | Risk |\n|----------|-------|------|\n`);
        stream.markdown(`| No labels | ${noLabels.length} | ${getRiskLevel(noLabels.length, issues.length)} |\n`);
        stream.markdown(`| No assignee | ${noAssignee.length} | ${getRiskLevel(noAssignee.length, issues.length)} |\n`);
        stream.markdown(`| Short description | ${shortDescription.length} | ${getRiskLevel(shortDescription.length, issues.length)} |\n`);
        stream.markdown(`| Missing acceptance criteria | ${noAcceptanceCriteria.length} | ${getRiskLevel(noAcceptanceCriteria.length, issues.length)} |\n\n`);
        // Show top issues needing attention
        const needsAttention = [...new Set([...noLabels.slice(0, 3), ...shortDescription.slice(0, 3)])];
        if (needsAttention.length > 0) {
            stream.markdown(`## 📋 Issues Needing Attention\n\n`);
            for (const issue of needsAttention.slice(0, 5)) {
                const problems = [];
                if (!issue.labels?.length)
                    problems.push('no labels');
                if (!issue.body || issue.body.length < 50)
                    problems.push('short description');
                if (!issue.assignee)
                    problems.push('unassigned');
                stream.markdown(`- **#${issue.number}**: ${issue.title}\n  - Issues: ${problems.join(', ')}\n`);
            }
        }
    }
    catch (error) {
        throw new Error(`Failed to analyze issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function handleSummaryCommand(request, stream, github, azureDevOps, token) {
    stream.progress('Gathering PM dashboard data...');
    const config = vscode.workspace.getConfiguration('pmCommandCenter');
    const owner = config.get('github.owner');
    const repo = config.get('github.repo');
    if (!owner || !repo) {
        stream.markdown(`⚠️ **GitHub not configured**`);
        return;
    }
    stream.markdown(`# 📊 PM Command Center Summary\n\n`);
    stream.markdown(`**Repository:** ${owner}/${repo}\n\n`);
    stream.markdown(`---\n\n`);
    // Fetch all data in parallel
    try {
        const [issues, milestones, runs] = await Promise.all([
            github.getOpenIssues(owner, repo),
            github.getMilestones(owner, repo),
            github.getWorkflowRuns(owner, repo)
        ]);
        // Issues overview
        stream.markdown(`## 📋 Issues\n\n`);
        stream.markdown(`- Open issues: **${issues.length}**\n`);
        const bugs = issues.filter(i => i.labels?.some((l) => l.name?.toLowerCase().includes('bug')));
        const features = issues.filter(i => i.labels?.some((l) => l.name?.toLowerCase().includes('feature') || l.name?.toLowerCase().includes('enhancement')));
        stream.markdown(`- 🐛 Bugs: ${bugs.length}\n`);
        stream.markdown(`- ✨ Features: ${features.length}\n\n`);
        // Milestones
        const openMilestones = milestones.filter(m => m.state === 'open');
        if (openMilestones.length > 0) {
            stream.markdown(`## 🚀 Active Releases\n\n`);
            for (const m of openMilestones.slice(0, 3)) {
                const total = m.open_issues + m.closed_issues;
                const progress = total > 0 ? Math.round((m.closed_issues / total) * 100) : 0;
                stream.markdown(`- **${m.title}**: ${progress}% complete (${m.open_issues} open)\n`);
            }
            stream.markdown('\n');
        }
        // CI/CD
        const recentRuns = runs.slice(0, 10);
        const successRate = recentRuns.length > 0
            ? Math.round((recentRuns.filter(r => r.conclusion === 'success').length / recentRuns.length) * 100)
            : 0;
        const running = runs.filter(r => r.status === 'in_progress').length;
        const failed = runs.filter(r => r.conclusion === 'failure').length;
        stream.markdown(`## 🔧 CI/CD Health\n\n`);
        stream.markdown(`- Success rate: **${successRate}%**\n`);
        stream.markdown(`- Running: ${running}\n`);
        stream.markdown(`- Failed (recent): ${failed}\n\n`);
        // Overall health
        const health = successRate >= 80 && failed === 0 ? '🟢 Healthy' :
            successRate >= 60 ? '🟡 Needs attention' : '🔴 Critical';
        stream.markdown(`---\n\n**Overall Status:** ${health}\n`);
    }
    catch (error) {
        throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function handleNaturalLanguage(request, chatContext, stream, github, azureDevOps, estimator, token) {
    const prompt = request.prompt.toLowerCase();
    // Route based on intent detection
    if (prompt.includes('release') || prompt.includes('milestone') || prompt.includes('on track') || prompt.includes('ship')) {
        await handleReleaseCommand(request, stream, github, azureDevOps, token);
    }
    else if (prompt.includes('estimate') || prompt.includes('points') || prompt.includes('how long') || prompt.includes('story point')) {
        await handleEstimateCommand(request, stream, estimator, github, token);
    }
    else if (prompt.includes('pipeline') || prompt.includes('build') || prompt.includes('ci') || prompt.includes('cd') || prompt.includes('deploy') || prompt.includes('workflow')) {
        await handleCICDCommand(request, stream, github, azureDevOps, token);
    }
    else if (prompt.includes('gap') || prompt.includes('missing') || prompt.includes('incomplete') || prompt.includes('quality')) {
        await handleGapsCommand(request, stream, github, azureDevOps, token);
    }
    else if (prompt.includes('summary') || prompt.includes('overview') || prompt.includes('dashboard') || prompt.includes('status')) {
        await handleSummaryCommand(request, stream, github, azureDevOps, token);
    }
    else {
        // Default help
        stream.markdown(`# 🎯 PM Command Center\n\n`);
        stream.markdown(`I can help you with:\n\n`);
        stream.markdown(`- **/release** - Check release readiness and milestone progress\n`);
        stream.markdown(`- **/estimate [story]** - Get story point estimates\n`);
        stream.markdown(`- **/cicd** - View CI/CD pipeline status\n`);
        stream.markdown(`- **/gaps** - Find issues with missing info\n`);
        stream.markdown(`- **/summary** - Full PM dashboard overview\n\n`);
        stream.markdown(`Or just ask me naturally, like:\n`);
        stream.markdown(`- "Are we on track for the release?"\n`);
        stream.markdown(`- "How many points should this story be?"\n`);
        stream.markdown(`- "Why is the build failing?"\n`);
    }
}
// Helper functions
function generateProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
function getPointsEmoji(points) {
    if (points <= 2)
        return '🟢';
    if (points <= 5)
        return '🟡';
    if (points <= 8)
        return '🟠';
    return '🔴';
}
function getRiskLevel(count, total) {
    const ratio = count / total;
    if (ratio < 0.1)
        return '🟢 Low';
    if (ratio < 0.3)
        return '🟡 Medium';
    return '🔴 High';
}
function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)
        return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60)
        return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map