export interface JwtUser {
    id: string;
    supabase_id: string;
    email: string;
    role: string;
    vendor_id?: string;
    full_name: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
