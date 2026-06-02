"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT ?? '3001', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    supabase: {
        url: process.env.SUPABASE_URL ?? '',
        anonKey: process.env.SUPABASE_ANON_KEY ?? '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        jwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
        storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'food-village-images',
    },
    database: {
        url: process.env.DATABASE_URL ?? '',
    },
});
//# sourceMappingURL=configuration.js.map