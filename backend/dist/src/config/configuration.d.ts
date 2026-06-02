declare const _default: () => {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
        jwtSecret: string;
        storageBucket: string;
    };
    database: {
        url: string;
    };
};
export default _default;
