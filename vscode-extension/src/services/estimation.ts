import * as vscode from 'vscode';

interface HistoricalIssue {
    title: string;
    labels?: Array<{ name: string }>;
    body?: string | null;
    storyPoints?: number;
    daysToComplete?: number;
    closed_at?: string | null;
    created_at?: string | null;
}

export interface EstimationResult {
    points: number;
    label: string;
    confidence: number;
    estimatedDays: number;
    basedOn: string;
    factors: string[];
    warnings: string[];
    similarIssues: Array<{
        title: string;
        points: number;
        similarity: number;
    }>;
}

// Complexity keywords for estimation
const COMPLEXITY_INDICATORS = {
    high: [
        'refactor', 'migration', 'architecture', 'security', 'performance',
        'database', 'integration', 'api redesign', 'breaking change', 'major',
        'infrastructure', 'scalability', 'distributed', 'concurrent'
    ],
    medium: [
        'feature', 'enhancement', 'implement', 'create', 'add support',
        'update', 'extend', 'new endpoint', 'authentication', 'validation'
    ],
    low: [
        'fix', 'bug', 'typo', 'update text', 'documentation', 'config',
        'minor', 'small', 'quick', 'simple', 'rename', 'cleanup'
    ]
};

// Fibonacci story points
const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];

export class EstimationEngine {
    private historicalData: HistoricalIssue[] = [];

    /**
     * Load historical data from closed issues for estimation learning
     */
    loadHistoricalData(issues: HistoricalIssue[]): void {
        this.historicalData = issues;
    }

    /**
     * Learn from historical closed issues (alias for loadHistoricalData)
     */
    learnFromHistory(issues: HistoricalIssue[]): void {
        this.loadHistoricalData(issues);
    }

    /**
     * Estimate story points for a given user story
     */
    estimate(storyText: string, description?: string, labels?: string[]): EstimationResult {
        const text = `${storyText} ${description || ''} ${(labels || []).join(' ')}`.toLowerCase();

        // Find similar historical issues
        const similarIssues = this.findSimilarIssues(text);

        // Calculate base complexity from keywords
        const keywordComplexity = this.analyzeKeywordComplexity(text);

        // Combine historical and keyword-based estimation
        let points: number;
        let confidence: number;
        let basedOn: string;
        const factors: string[] = [];
        const warnings: string[] = [];

        if (similarIssues.length >= 3 && similarIssues[0].similarity > 0.5) {
            // Strong historical match - use historical data
            const avgPoints = similarIssues.slice(0, 3).reduce((sum, i) => sum + i.points, 0) / 3;
            points = this.nearestFibonacci(avgPoints);
            confidence = similarIssues[0].similarity > 0.7 ? 85 : 70;
            basedOn = `${similarIssues.length} similar completed stories`;
            factors.push(`Found ${similarIssues.length} similar historical issues`);
        } else if (similarIssues.length >= 1 && similarIssues[0].similarity > 0.3) {
            // Weak historical match - blend with keyword analysis
            const historicalAvg = similarIssues[0].points;
            const blendedPoints = (historicalAvg + keywordComplexity.points) / 2;
            points = this.nearestFibonacci(blendedPoints);
            confidence = 60;
            basedOn = `${similarIssues.length} related stories + complexity analysis`;
            factors.push(`Blended estimate from historical data and keyword analysis`);
        } else {
            // No historical match - use keyword analysis only
            points = keywordComplexity.points;
            confidence = keywordComplexity.matchCount > 2 ? 55 : 40;
            basedOn = keywordComplexity.reason;
            factors.push(keywordComplexity.reason);
            if (this.historicalData.length === 0) {
                warnings.push('No historical data available - estimate based on heuristics only');
            }
        }

        // Add complexity factors from keyword analysis
        if (keywordComplexity.matchedKeywords.length > 0) {
            factors.push(`Complexity keywords: ${keywordComplexity.matchedKeywords.slice(0, 3).join(', ')}`);
        }

        // Add warnings for potentially underestimated stories
        if (text.includes('integration') && points < 5) {
            warnings.push('Integration work often takes longer than expected');
        }
        if (text.includes('security') && points < 5) {
            warnings.push('Security features require thorough review and testing');
        }
        if (text.length < 50) {
            warnings.push('Story description is brief - consider adding more detail');
        }

        // Calculate estimated days (rough: 1 point ≈ 0.5-1 day)
        const estimatedDays = Math.ceil(points * 0.75);

        // Get label based on points
        const label = this.getPointsLabel(points);

        return {
            points,
            label,
            confidence,
            estimatedDays,
            basedOn,
            factors,
            warnings,
            similarIssues: similarIssues.slice(0, 3)
        };
    }

    /**
     * Find similar historical issues using keyword matching
     */
    private findSimilarIssues(text: string): Array<{ title: string; points: number; similarity: number }> {
        if (this.historicalData.length === 0) {
            return [];
        }

        const textWords = new Set(text.split(/\s+/).filter(w => w.length > 3));

        return this.historicalData
            .map(issue => {
                const labelNames = issue.labels?.map(l => l.name).join(' ') || '';
                const issueText = `${issue.title} ${issue.body || ''} ${labelNames}`.toLowerCase();
                const issueWords = new Set(issueText.split(/\s+/).filter(w => w.length > 3));

                // Calculate Jaccard similarity
                const intersection = [...textWords].filter(w => issueWords.has(w)).length;
                const union = new Set([...textWords, ...issueWords]).size;
                const similarity = union > 0 ? intersection / union : 0;

                // Estimate story points from labels or default
                let storyPoints = issue.storyPoints || 3;
                if (issue.labels) {
                    for (const label of issue.labels) {
                        const match = label.name.match(/(\d+)\s*points?/i);
                        if (match) {
                            storyPoints = parseInt(match[1], 10);
                            break;
                        }
                    }
                }

                return {
                    title: issue.title,
                    points: storyPoints,
                    similarity
                };
            })
            .filter(item => item.similarity > 0.1)
            .sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Analyze text for complexity keywords
     */
    private analyzeKeywordComplexity(text: string): { points: number; reason: string; matchCount: number; matchedKeywords: string[] } {
        let highCount = 0;
        let mediumCount = 0;
        let lowCount = 0;
        const matchedKeywords: string[] = [];

        for (const keyword of COMPLEXITY_INDICATORS.high) {
            if (text.includes(keyword)) {
                highCount++;
                matchedKeywords.push(keyword);
            }
        }

        for (const keyword of COMPLEXITY_INDICATORS.medium) {
            if (text.includes(keyword)) {
                mediumCount++;
                matchedKeywords.push(keyword);
            }
        }

        for (const keyword of COMPLEXITY_INDICATORS.low) {
            if (text.includes(keyword)) {
                lowCount++;
                matchedKeywords.push(keyword);
            }
        }

        let points: number;
        let reason: string;

        if (highCount >= 2) {
            points = 13;
            reason = `High complexity indicators: ${matchedKeywords.slice(0, 3).join(', ')}`;
        } else if (highCount === 1) {
            points = 8;
            reason = `Complexity indicator found: ${matchedKeywords[0]}`;
        } else if (mediumCount >= 2) {
            points = 5;
            reason = `Medium complexity: ${matchedKeywords.slice(0, 3).join(', ')}`;
        } else if (mediumCount === 1 || lowCount === 0) {
            points = 3;
            reason = 'Standard feature complexity';
        } else if (lowCount >= 2) {
            points = 1;
            reason = `Low complexity indicators: ${matchedKeywords.slice(0, 3).join(', ')}`;
        } else {
            points = 2;
            reason = 'Default estimate for unclear scope';
        }

        return {
            points,
            reason,
            matchCount: highCount + mediumCount + lowCount,
            matchedKeywords
        };
    }

    /**
     * Get label description for point value
     */
    private getPointsLabel(points: number): string {
        switch (points) {
            case 1: return 'Trivial';
            case 2: return 'Small';
            case 3: return 'Medium';
            case 5: return 'Large';
            case 8: return 'Very Large';
            case 13: return 'Epic';
            case 21: return 'Needs Breakdown';
            default: return 'Unknown';
        }
    }

    /**
     * Round to nearest Fibonacci number
     */
    private nearestFibonacci(value: number): number {
        let closest = STORY_POINTS[0];
        let minDiff = Math.abs(value - closest);

        for (const point of STORY_POINTS) {
            const diff = Math.abs(value - point);
            if (diff < minDiff) {
                minDiff = diff;
                closest = point;
            }
        }

        return closest;
    }

    /**
     * Batch estimate multiple stories
     */
    batchEstimate(stories: Array<{ title: string; description?: string; labels?: string[] }>): Array<{
        title: string;
        estimate: EstimationResult;
    }> {
        return stories.map(story => ({
            title: story.title,
            estimate: this.estimate(story.title, story.description, story.labels)
        }));
    }

    /**
     * Get estimation statistics from historical data
     */
    getStatistics(): {
        totalIssues: number;
        averagePoints: number;
        pointsDistribution: Record<number, number>;
    } {
        if (this.historicalData.length === 0) {
            return {
                totalIssues: 0,
                averagePoints: 0,
                pointsDistribution: {}
            };
        }

        const points = this.historicalData.map(i => i.storyPoints!);
        const distribution: Record<number, number> = {};

        for (const p of points) {
            distribution[p] = (distribution[p] || 0) + 1;
        }

        return {
            totalIssues: points.length,
            averagePoints: points.reduce((a, b) => a + b, 0) / points.length,
            pointsDistribution: distribution
        };
    }
}
