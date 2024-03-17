export interface TOAuthClient {
    id: string;
    secret: string;
    scopes: string[];
}

export interface TOAuthBody {
    grant_type: string;
    username?: string;
    password?: string;
    refresh_token?: string;
    exchange_code?: string;
    external_auth_type?: string;
    external_auth_token?: string;
}