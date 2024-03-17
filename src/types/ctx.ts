import type { ApiError } from '../utils/error';

declare module 'hono' {
    interface Context {
        sendStatus: (status: number) => Response;
        sendError: (error: ApiError) => Response;
        sendIni: (ini: string) => Response;
        enhanced: boolean;
    }
}