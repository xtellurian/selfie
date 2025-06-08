import { spawn } from 'child_process';
export class ContainerManager {
    activeContainers = new Map();
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async runContainer(options) {
        const { containerName, timeoutMs } = options;
        this.log('info', `Starting container: ${containerName}`);
        try {
            // Build docker run command
            const dockerArgs = this.buildDockerArgs(options);
            // Spawn docker process
            const dockerProcess = spawn('docker', dockerArgs, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            this.activeContainers.set(containerName, dockerProcess);
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            // Collect output
            dockerProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            dockerProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            // Set up timeout
            const timeoutHandle = setTimeout(() => {
                timedOut = true;
                this.log('warn', `Container ${containerName} timed out after ${timeoutMs}ms`);
                this.killContainer(containerName);
            }, timeoutMs);
            // Wait for process to complete
            const exitCode = await new Promise((resolve) => {
                dockerProcess.on('close', (code) => {
                    clearTimeout(timeoutHandle);
                    resolve(code);
                });
                dockerProcess.on('error', (error) => {
                    clearTimeout(timeoutHandle);
                    this.log('error', `Container process error: ${error.message}`);
                    resolve(null);
                });
            });
            this.activeContainers.delete(containerName);
            const result = {
                exitCode,
                stdout,
                stderr,
                timedOut
            };
            this.log('info', `Container ${containerName} completed with exit code: ${exitCode}`);
            return result;
        }
        catch (error) {
            this.log('error', `Failed to run container ${containerName}:`, error);
            this.activeContainers.delete(containerName);
            throw error;
        }
    }
    buildDockerArgs(options) {
        const { containerName, imageName, environment, workDir, volumes } = options;
        const args = [
            'run',
            '--rm', // Remove container when it exits
            '--name', containerName,
        ];
        // Add environment variables
        for (const [key, value] of Object.entries(environment)) {
            args.push('-e', `${key}=${value}`);
        }
        // Add volumes
        if (volumes) {
            for (const volume of volumes) {
                args.push('-v', volume);
            }
        }
        // Add working directory
        if (workDir) {
            args.push('-w', workDir);
        }
        // Add image name
        args.push(imageName);
        return args;
    }
    async killContainer(containerName) {
        const process = this.activeContainers.get(containerName);
        if (process) {
            this.log('info', `Killing container: ${containerName}`);
            try {
                // Try graceful termination first
                process.kill('SIGTERM');
                // Wait a bit, then force kill if still running
                setTimeout(() => {
                    if (!process.killed) {
                        process.kill('SIGKILL');
                    }
                }, 5000);
            }
            catch (error) {
                this.log('error', `Error killing container ${containerName}:`, error);
            }
        }
        // Also try to stop container via docker command
        try {
            const dockerStop = spawn('docker', ['stop', containerName]);
            await new Promise((resolve) => {
                dockerStop.on('close', () => resolve());
                dockerStop.on('error', () => resolve()); // Continue even if stop fails
            });
        }
        catch (error) {
            this.log('warn', `Failed to stop container via docker stop: ${error}`);
        }
        this.activeContainers.delete(containerName);
    }
    async killAllContainers() {
        const containerNames = Array.from(this.activeContainers.keys());
        await Promise.all(containerNames.map(name => this.killContainer(name)));
    }
    getActiveContainers() {
        return Array.from(this.activeContainers.keys());
    }
    async buildImage(imageName, dockerfilePath, contextPath = '.') {
        this.log('info', `Building Docker image: ${imageName}`);
        try {
            const buildProcess = spawn('docker', [
                'build',
                '-t', imageName,
                '-f', dockerfilePath,
                contextPath
            ]);
            let stderr = '';
            buildProcess.stdout?.on('data', (_data) => {
                // Stdout data is available but not currently used
            });
            buildProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            const exitCode = await new Promise((resolve) => {
                buildProcess.on('close', (code) => resolve(code));
                buildProcess.on('error', () => resolve(null));
            });
            if (exitCode === 0) {
                this.log('info', `Successfully built image: ${imageName}`);
                return true;
            }
            else {
                this.log('error', `Failed to build image ${imageName}. Exit code: ${exitCode}`);
                this.log('error', `Build stderr: ${stderr}`);
                return false;
            }
        }
        catch (error) {
            this.log('error', `Error building image ${imageName}:`, error);
            return false;
        }
    }
    log(level, message, ...args) {
        if (this.logger) {
            this.logger.log(level, message, ...args);
        }
        else {
            console.log(`[${level.toUpperCase()}] ${message}`, ...args);
        }
    }
}
