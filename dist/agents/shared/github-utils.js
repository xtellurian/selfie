import { Octokit } from '@octokit/rest';
export class GitHubUtils {
    octokit;
    owner;
    repo;
    constructor(token, owner, repo) {
        this.octokit = new Octokit({
            auth: token,
        });
        this.owner = owner;
        this.repo = repo;
    }
    async getIssues(labels = [], state = 'open') {
        try {
            const response = await this.octokit.issues.listForRepo({
                owner: this.owner,
                repo: this.repo,
                labels: labels.join(','),
                state,
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching issues:', error);
            throw error;
        }
    }
    async getIssue(issueNumber) {
        try {
            const response = await this.octokit.issues.get({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching issue #${issueNumber}:`, error);
            throw error;
        }
    }
    async createIssueComment(issueNumber, body) {
        try {
            const response = await this.octokit.issues.createComment({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                body,
            });
            return { id: response.data.id, html_url: response.data.html_url };
        }
        catch (error) {
            console.error(`Error creating comment on issue #${issueNumber}:`, error);
            throw error;
        }
    }
    async createBranch(branchName, fromBranch = 'main') {
        try {
            // First check if branch already exists
            try {
                await this.octokit.repos.getBranch({
                    owner: this.owner,
                    repo: this.repo,
                    branch: branchName,
                });
                // Branch already exists, no need to create it
                return;
            }
            catch (error) {
                // Branch doesn't exist (404), proceed with creation
                if (error.status !== 404) {
                    throw error;
                }
            }
            // Get the SHA of the source branch
            const sourceBranch = await this.octokit.repos.getBranch({
                owner: this.owner,
                repo: this.repo,
                branch: fromBranch,
            });
            // Create the new branch
            await this.octokit.git.createRef({
                owner: this.owner,
                repo: this.repo,
                ref: `refs/heads/${branchName}`,
                sha: sourceBranch.data.commit.sha,
            });
        }
        catch (error) {
            // If the branch reference already exists, it's not necessarily an error
            const errorObj = error;
            if (errorObj.status === 422 && errorObj.message?.includes('Reference already exists')) {
                // Branch was created between our check and creation attempt, that's fine
                return;
            }
            console.error(`Error creating branch ${branchName}:`, error);
            throw error;
        }
    }
    async createPullRequest(title, head, base, body) {
        try {
            const response = await this.octokit.pulls.create({
                owner: this.owner,
                repo: this.repo,
                title,
                head,
                base,
                body,
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating pull request:', error);
            throw error;
        }
    }
    async createPullRequestWithBranch(title, branchName, base, body) {
        try {
            // Create the branch first (handles existing branches gracefully)
            await this.createBranch(branchName, base);
            // Then create the pull request
            return await this.createPullRequest(title, branchName, base, body);
        }
        catch (error) {
            // Handle specific PR creation errors
            const errorObj = error;
            if (errorObj.status === 422) {
                if (errorObj.message?.includes('pull request already exists')) {
                    // PR already exists, try to find and return it
                    try {
                        const existingPR = await this.findExistingPullRequest(branchName, base);
                        if (existingPR) {
                            return existingPR;
                        }
                    }
                    catch (findError) {
                        // If we can't find existing PR, continue with original error
                    }
                }
            }
            console.error('Error creating pull request with branch:', error);
            throw error;
        }
    }
    async findExistingPullRequest(head, base) {
        try {
            const response = await this.octokit.pulls.list({
                owner: this.owner,
                repo: this.repo,
                head: `${this.owner}:${head}`,
                base,
                state: 'open'
            });
            return response.data.length > 0 ? response.data[0] : null;
        }
        catch (error) {
            console.error('Error finding existing pull request:', error);
            return null;
        }
    }
    parseIssueLabels(issue) {
        return issue.labels.map(label => typeof label === 'string' ? label : label.name);
    }
    hasLabel(issue, labelName) {
        const labels = this.parseIssueLabels(issue);
        return labels.includes(labelName);
    }
    async getCurrentBranch() {
        try {
            // Get the default branch of the repository
            const repo = await this.octokit.repos.get({
                owner: this.owner,
                repo: this.repo,
            });
            return repo.data.default_branch;
        }
        catch (error) {
            console.error('Error getting current branch:', error);
            throw error;
        }
    }
    async deleteBranch(branchName) {
        try {
            await this.octokit.git.deleteRef({
                owner: this.owner,
                repo: this.repo,
                ref: `heads/${branchName}`,
            });
        }
        catch (error) {
            console.error(`Error deleting branch ${branchName}:`, error);
            throw error;
        }
    }
    async branchExists(branchName) {
        try {
            await this.octokit.repos.getBranch({
                owner: this.owner,
                repo: this.repo,
                branch: branchName,
            });
            return true;
        }
        catch (error) {
            const errorObj = error;
            if (errorObj.status === 404) {
                return false;
            }
            throw error;
        }
    }
}
