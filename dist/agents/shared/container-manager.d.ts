export interface ContainerOptions {
    imageName: string;
    containerName: string;
    environment: Record<string, string>;
    timeoutMs: number;
    workDir?: string;
    volumes?: string[];
}
export interface ContainerResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
}
export declare class ContainerManager {
    private activeContainers;
    private logger?;
    constructor(logger?: typeof console);
    runContainer(options: ContainerOptions): Promise<ContainerResult>;
    private buildDockerArgs;
    killContainer(containerName: string): Promise<void>;
    killAllContainers(): Promise<void>;
    getActiveContainers(): string[];
    buildImage(imageName: string, dockerfilePath: string, contextPath?: string): Promise<boolean>;
    private log;
}
