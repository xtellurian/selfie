import { DeveloperAgent } from './agents/developer/developer-agent.js';
async function main() {
    // Get configuration from environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const issueNumberStr = process.env.ISSUE_NUMBER;
    const agentType = process.env.AGENT_TYPE;
    if (!githubToken || !owner || !repo || !issueNumberStr || !agentType) {
        console.error('Missing required environment variables:');
        console.error('- GITHUB_TOKEN');
        console.error('- GITHUB_OWNER');
        console.error('- GITHUB_REPO');
        console.error('- ISSUE_NUMBER');
        console.error('- AGENT_TYPE');
        process.exit(1);
    }
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber)) {
        console.error('ISSUE_NUMBER must be a valid integer');
        process.exit(1);
    }
    console.log(`Starting ${agentType} agent in container for issue #${issueNumber}`);
    try {
        if (agentType === 'developer') {
            const agent = new DeveloperAgent({
                githubToken,
                owner,
                repo,
                issueNumber,
            });
            await agent.start();
            // Keep the container running until the agent completes
            await new Promise((resolve, reject) => {
                agent.on('completed', () => {
                    console.log('Developer agent completed successfully');
                    resolve();
                });
                agent.on('failed', (error) => {
                    console.error('Developer agent failed:', error);
                    reject(error);
                });
                // Graceful shutdown handling
                process.on('SIGTERM', async () => {
                    console.log('Received SIGTERM, shutting down gracefully...');
                    await agent.stop();
                    resolve();
                });
                process.on('SIGINT', async () => {
                    console.log('Received SIGINT, shutting down gracefully...');
                    await agent.stop();
                    resolve();
                });
            });
        }
        else {
            console.error(`Unknown agent type: ${agentType}`);
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Container agent failed:', error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error('Unhandled error in container entry:', error);
    process.exit(1);
});
