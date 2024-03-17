import type { StatusCode } from 'hono/utils/http-status';
import { type ApiError } from '../utils/error';
import { createMiddleware } from 'hono/factory';

const responseEnhancementsMiddleware = () =>
    createMiddleware(async (c, next) => {
        if (c.enhanced) {
            return next();
        }

        c.sendError = (error: ApiError) => {
            c.status(error.statusCode as StatusCode);
            return c.json(error.response);
        };

        c.sendIni = (ini: string) => {
            c.res.headers.set('Content-Type', 'text/plain');
            return c.body(ini);
        };

        c.sendStatus = (statusCode: number) => {
            c.status(statusCode as StatusCode);
            return c.body(null);
        };

        c.enhanced = true;

        await next();
    });

export default responseEnhancementsMiddleware;