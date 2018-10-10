import { Cluster } from 'cluster';

export = forky;

declare function forky(opts: {
    path: string;
    workers?: number;
    callback?: (err: Error, cluster: Cluster) => void;
    enable_logging?: boolean;
    kill_timeout?: number;
    scheduling_policy?: number;
}): void;

declare function forky(
    path: string,
    workers: number,
    cb: (err: Error, cluster: Cluster) => void
): void;

declare interface forky {
    log(message: string, ...args: any[]): void;
    disconnect(timeout?: number): void;
}

declare namespace forky {
    function log(message: string, ...args: any[]): void;
    function disconnect(timeout?: number): void;
}
