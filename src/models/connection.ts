interface Connection {
    name: string;
    host: string;
    port: number;
    username: string;
}

export type Connections = Connection[];