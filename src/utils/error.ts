import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface ResponseBody {
    errorCode: string;
    errorMessage: string;
    messageVars?: string[];
    numericErrorCode: number;
    originatingService: string;
    intent: string;
    validationFailures?: Record<string, object>;
}

export class ApiError {
    statusCode: number;
    public response: ResponseBody;

    constructor(code: string, message: string, numeric: number, statusCode: number, ...messageVariables: string[]) {
        this.statusCode = statusCode;
        this.response = {
            errorCode: code,
            errorMessage: message,
            messageVars: messageVariables.length > 0 ? messageVariables : undefined,
            numericErrorCode: numeric,
            originatingService: 'Aphrodite',
            intent: 'unknown'
        };
    }

    withMessage(message: string): this {
        this.response.errorMessage = message;
        return this;
    }

    variable(variables: string[]): this {
        const replacables = this.response.errorMessage.match(/{\d}/g)?.map((match) => match.replaceAll(/[{}]/g, ''));

        if (!replacables) return this;

        for (const placeholderIndex of replacables) {
            const variable = variables[Number.parseInt(placeholderIndex)];
            if (variable) {
                this.response.errorMessage = this.response.errorMessage.replace(`{${placeholderIndex}}`, variable);
            }
        }

        return this;
    }

    originatingService(service: string): this {
        this.response.originatingService = service;
        return this;
    }

    with(...messageVariables: string[]): this {
        this.response.messageVars = this.response.messageVars?.concat(messageVariables) || messageVariables;
        return this;
    }

    apply(c: Context): ResponseBody {
        this.response.errorMessage = this.getMessage();
        c.res.headers.set('Content-Type', 'application/json');
        c.res.headers.set('X-Epic-Error-Code', `${this.response.numericErrorCode}`);
        c.res.headers.set('X-Epic-Error-Name', this.response.errorCode);
        c.status(this.statusCode as any);
        return this.response;
    }

    getMessage(): string {
        return this.response.messageVars?.reduce((message, msgVar, index) => message.replace(`{${index}}`, msgVar), this.response.errorMessage) || this.response.errorMessage;
    }

    shortenedError(): string {
        return `${this.response.errorCode} - ${this.response.errorMessage}`;
    }

    throwHttpException(): never {
        const errorResponse = new Response(JSON.stringify(this.response), {
            status: this.statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Epic-Error-Code': `${this.response.numericErrorCode}`,
                'X-Epic-Error-Name': this.response.errorCode
            }
        });
        throw new HTTPException(this.statusCode as any, { res: errorResponse });
    }

    devMessage(message: string, devMode: string | undefined) {
        if (devMode !== 'true') return this;
        this.response.errorMessage += `(Dev: -${message}-)`;
        return this;
    }

}
export const Aphrodite = {
    proxy: {
        get fetchError() {
            return new ApiError('errors.com.epicgames.proxy.fetchError', 'An error occurred while fetching data from {0}', 1000, 500);
        },
        get noResponseDetails() {
            return new ApiError('errors.com.epicgames.proxy.noResponseDetails', 'No response details were found', 1000, 500);
        },
        get invalidMethod() {
            return new ApiError('errors.com.epicgames.proxy.invalidMethod', 'Invalid method', 1000, 500);
        },
        get invalidBody() {
            return new ApiError('errors.com.epicgames.proxy.invalidBody', 'Invalid body', 1000, 500);
        },
        get invalidQuery() {
            return new ApiError('errors.com.epicgames.proxy.invalidQuery', 'Invalid query', 1000, 500);
        },
        get invalidHeader() {
            return new ApiError('errors.com.epicgames.proxy.invalidHeader', 'Invalid header', 1000, 500);
        },
        get invalidUrl() {
            return new ApiError('errors.com.epicgames.proxy.invalidUrl', 'Invalid url', 1000, 500);
        },
        get invalidStatus() {
            return new ApiError('errors.com.epicgames.proxy.invalidStatus', 'Invalid status', 1000, 500);
        },
    },
    authentication: {
        get invalidHeader() {
            return new ApiError('errors.com.epicgames.authentication.invalidHeader', 'It looks like your authorization header is invalid or missing, please verify that you are sending the correct headers.', 1011, 400);
        },
        get invalidRequest() {
            return new ApiError('errors.com.epicgames.authentication.invalidRequest', 'The request body you provided is either invalid or missing elements.', 1013, 400);
        },
        get invalidToken() {
            return new ApiError('errors.com.epicgames.authentication.invalidToken', 'Invalid token {0}', 1014, 401);
        },
        get wrongGrantType() {
            return new ApiError('errors.com.epicgames.authentication.wrongGrantType', 'Sorry, your client does not have the proper grant_type for access.', 1016, 400);
        },
        get notYourAccount() {
            return new ApiError('errors.com.epicgames.authentication.notYourAccount', "You are not allowed to make changes to other people's accounts", 1023, 403);
        },
        get validationFailed() {
            return new ApiError('errors.com.epicgames.authentication.validationFailed', "Sorry we couldn't validate your token {0}. Please try with a new token.", 1031, 401);
        },
        get authenticationFailed() {
            return new ApiError('errors.com.epicgames.authentication.authenticationFailed', 'Authentication failed for {0}', 1032, 401);
        },
        get notOwnSessionRemoval() {
            return new ApiError('errors.com.epicgames.authentication.notOwnSessionRemoval', 'Sorry you cannot remove the auth session {0}. It was not issued to you.', 18040, 403);
        },
        get unknownSession() {
            return new ApiError('errors.com.epicgames.authentication.unknownSession', 'Sorry we could not find the auth session {0}', 18051, 404);
        },
        get usedClientToken() {
            return new ApiError('errors.com.epicgames.authentication.wrongTokenType', 'This route requires quthentication via user access tokens, but you are using a client token', 18052, 401);
        },
        oauth: {
            get invalidBody() {
                return new ApiError('errors.com.epicgames.authentication.oauth.invalidBody', 'The request body you provided is either invalid or missing elements.', 1013, 400);
            },
            get invalidExternalAuthType() {
                return new ApiError('errors.com.epicgames.authentication.oauth.invalidExternalAuthType', 'The external auth type {0} you used is not supported by the server.', 1016, 400);
            },
            get grantNotImplemented() {
                return new ApiError('errors.com.epicgames.authentication.grantNotImplemented', 'The grant_type {0} you used is not supported by the server.', 1016, 501);
            },
            get tooManySessions() {
                return new ApiError('errors.com.epicgames.authentication.oauth.tooManySessions', 'Sorry too many sessions have been issued for your account. Please try again later', 18048, 400);
            },
            get invalidAccountCredentials() {
                return new ApiError('errors.com.epicgames.authentication.oauth.invalidAccountCredentials', 'Sorry the account credentials you are using are invalid', 18031, 400);
            },
            get invalidRefresh() {
                return new ApiError('errors.com.epicgames.authentication.oauth.invalidRefresh', 'The refresh token you provided is invalid.', 18036, 400);
            },
            get invalidClient() {
                return new ApiError('errors.com.epicgames.authentication.oauth.invalidClient', 'The client credentials you are using are invalid.', 18033, 403);
            },
            get invalidExchange() {
                return new ApiError('errors.com.epicgames.authentication.oauth.invalidExchange', 'The exchange code {0} is invalid.', 18057, 400);
            },
            get expiredExchangeCodeSession() {
                return new ApiError('errors.com.epicgames.authentication.oauth.expiredExchangeCodeSession', 'Sorry the originating session for the exchange code has expired.', 18128, 400);
            },
            get correctiveActionRequired() {
                return new ApiError('errors.com.epicgames.authentication.oauth.corrective_action_required', 'Corrective action is required to continue.', 18206, 400);
            }
        }
    },
    party: {
        get partyNotFound() {
            return new ApiError('errors.com.epicgames.party.partyNotFound', 'Party {0} does not exist.', 51002, 404);
        },
        get memberNotFound() {
            return new ApiError('errors.com.epicgames.party.memberNotFound', 'Party member {0} does not exist.', 51004, 404);
        },
        get alreadyInParty() {
            return new ApiError('errors.com.epicgames.party.alreadyInParty', 'Your already in a party.', 51012, 409);
        },
        get userHasNoParty() {
            return new ApiError('errors.com.epicgames.party.userHasNoParty', 'User {0} has no party to join.', 51019, 404);
        },
        get notLeader() {
            return new ApiError('errors.com.epicgames.party.notLeader', 'You are not the party leader.', 51015, 403);
        },
        get pingNotFound() {
            return new ApiError('errors.com.epicgames.party.pingNotFound', "Sorry, we couldn't find a ping.", 51021, 404);
        },
        get pingForbidden() {
            return new ApiError('errors.com.epicgames.party.pingForbidden', 'User is not authorized to send pings the desired user', 51020, 403);
        },
        get notYourAccount() {
            return new ApiError('errors.com.epicgames.party.notYourAccount', "You are not allowed to make changes to other people's accounts", 51023, 403);
        },
        get userOffline() {
            return new ApiError('errors.com.epicgames.party.userOffline', 'User is offline.', 51024, 403);
        },
        get selfPing() {
            return new ApiError('errors.com.epicgames.party.selfPing', 'Self pings are not allowed.', 51028, 400);
        },
        get selfInvite() {
            return new ApiError('errors.com.epicgames.party.selfInvite', 'Self invites are not allowed.', 51040, 400);
        }
    },
    cloudstorage: {
        get fileNotFound() {
            return new ApiError('errors.com.epicgames.cloudstorage.fileNotFound', 'Cannot find the file you requested.', 12004, 404);
        },
        get fileTooLarge() {
            return new ApiError('errors.com.epicgames.cloudstorage.fileTooLarge', 'The file you are trying to upload is too large', 12004, 413);
        },
        get invalidAuth() {
            return new ApiError('errors.com.epicgames.cloudstorage.invalidAuth', 'Invalid auth token', 12004, 401);
        }
    },
    account: {
        get disabledAccount() {
            return new ApiError('errors.com.epicgames.account.disabledAccount', 'Sorry, your account is disabled.', 18001, 403);
        },
        get invalidAccountIdCount() {
            return new ApiError('errors.com.epicgames.account.invalidAccountIdCount', 'Sorry, the number of account id should be at least one and not more than 100.', 18066, 400);
        },
        get accountNotFound() {
            return new ApiError('errors.com.epicgames.account.accountNotFound', "Sorry, we couldn't find an account for {displayName}", 18007, 404);
        }
    },
    mcp: {
        get profileNotFound() {
            return new ApiError('errors.com.epicgames.mcp.profileNotFound', "Sorry, we couldn't find a profile for {accountId}", 18007, 404);
        },
        get emptyItems() {
            return new ApiError('errors.com.epicgames.mcp.emptyItems', 'No items found', 12700, 404);
        },
        get notEnoughMtx() {
            return new ApiError('errors.com.epicgames.mcp.notEnoughMtx', 'Purchase: {0}: Required {1} MTX but account balance is only {2}.', 12720, 400);
        },
        get wrongCommand() {
            return new ApiError('errors.com.epicgames.mcp.wrongCommand', 'Wrong command.', 12801, 400);
        },
        get operationForbidden() {
            return new ApiError('errors.com.epicgames.mcp.operationForbidden', 'Operation Forbidden', 12813, 403);
        },
        get templateNotFound() {
            return new ApiError('errors.com.epicgames.mcp.templateNotFound', 'Unable to find template configuration for profile', 12813, 404);
        },
        get invalidHeader() {
            return new ApiError('errors.com.epicgames.mcp.invalidHeader', 'Parsing client revisions header failed.', 12831, 400);
        },
        get invalidPayload() {
            return new ApiError('errors.com.epicgames.mcp.invalidPayload', 'Unable to parse command', 12806, 400);
        },
        get missingPermission() {
            return new ApiError('errors.com.epicgames.mcp.missingPermission', "Sorry your login does not posses the permissions '{0} {1}' needed to perform the requested operation", 12806, 403);
        },
        get itemNotFound() {
            return new ApiError('errors.com.epicgames.mcp.itemNotFound', 'Locker item not found', 16006, 404);
        },
        wrongItemType(itemId: string, itemType: string) {
            return new ApiError('errors.com.epicgames.mcp.wrongItemType', `Item ${itemId} is not a ${itemType}`, 16009, 400);
        },
        get invalidChatRequest() {
            return new ApiError('errors.com.epicgames.mcp.invalidChatRequest', '', 16090, 400);
        },
        get operationNotFound() {
            return new ApiError('errors.com.epicgames.mcp.operationNotFound', 'Operation not found', 16035, 404);
        },
        get InvalidLockerSlotIndex() {
            return new ApiError('errors.com.epicgames.mcp.InvalidLockerSlotIndex', 'Invalid loadout index {0}, slot is empty', 16173, 400);
        },
        get outOfBounds() {
            return new ApiError('errors.com.epicgames.mcp.outOfBounds', 'Invalid loadout index (source: {0}, target: {1})', 16026, 400);
        }
    },
    gamecatalog: {
        get invalidParameter() {
            return new ApiError('errors.com.epicgames.gamecatalog.invalidParameter', 'PurchaseCatalogEntry cannot be used for RealMoney prices. Use VerifyRealMoneyPurchase flow instead.', 28000, 400);
        },
        itemNotFound(offerId: string) {
            return new ApiError('errors.com.epicgames.mcp.catalogOutOfDate', `Could not find catalog item ${offerId}`, 28001, 400, offerId);
        },
        priceMismatch(expectedPrice: number, actualPrice: number) {
            return new ApiError('errors.com.epicgames.mcp.catalogOutOfDate', `Expected total price of ${expectedPrice} did not match actual price ${actualPrice}`, 28001, 400, expectedPrice.toString(), actualPrice.toString());
        },
        priceNotFound(currency: string, currencySubType: string, offerId: string) {
            return new ApiError('errors.com.epicgames.mcp.catalogOutOfDate', `Could not find ${currency}-${currencySubType} price for catalog item ${offerId}`, 28001, 400, currency, currencySubType, offerId);
        },
        purchaseNotAllowed(devName: string, fulfillmentId: string, fulfillmentCount: number, fulfillmentLimit: number) {
            return new ApiError('errors.com.epicgames.gamecatalog.purchaseNotAllowed', `Could not purchase catalog offer ${devName} because fulfillment ${fulfillmentId} is owned ${fulfillmentCount} time(s) (exceeding the limit of ${fulfillmentLimit})`, 28004, 400);
        }
    },
    matchmaking: {
        get unknownSession() {
            return new ApiError('errors.com.epicgames.matchmaking.unknownSession', 'unknown session id', 12101, 404);
        },
        get missingCookie() {
            return new ApiError('errors.com.epicgames.matchmaking.missingCookie', 'Missing custom NetCL cookie', 1001, 400);
        },
        get invalidBucketId() {
            return new ApiError('errors.com.epicgames.matchmaking.invalidBucketId', 'blank or invalid bucketId', 16102, 400);
        },
        get invalidPartyPlayers() {
            return new ApiError('errors.com.epicgames.matchmaking.invalidPartyPlayers', 'blank or invalid partyPlayerIds', 16103, 400);
        },
        get invalidPlatform() {
            return new ApiError('errors.com.epicgames.matchmaking.invalidPlatform', 'invalid platform', 16104, 400);
        },
        get notAllowedIngame() {
            return new ApiError('errors.com.epicgames.matchmaking.notAllowedIngame', 'Player is not allowed to play in game due to equipping items they do not own', 16105, 400);
        }
    },
    friends: {
        get selfFriend() {
            return new ApiError('errors.com.epicgames.friends.selfFriend', 'You cannot be friend with yourself.', 14001, 400);
        },
        get accountNotFound() {
            return new ApiError('errors.com.epicgames.friends.accountNotFound', 'Account does not exist', 14011, 404);
        },
        get friendshipNotFound() {
            return new ApiError('errors.com.epicgames.friends.friendshipNotFound', 'Friendship does not exist', 14004, 404);
        },
        get requestAlreadySent() {
            return new ApiError('errors.com.epicgames.friends.requestAlreadySent', 'Friendship request has already been sent.', 14014, 409);
        },
        get invalidData() {
            return new ApiError('errors.com.epicgames.friends.invalidData', 'Invalid data', 14015, 400);
        }
    },
    internal: {
        get validationFailed() {
            return new ApiError('errors.com.epicgames.internal.validationFailed', 'Validation Failed. Invalid fields were {0}', 1040, 400);
        },
        get invalidUserAgent() {
            return new ApiError('errors.com.epicgames.internal.invalidUserAgent', 'The user-agent header you provided does not match a unreal engine formated user-agent', 16183, 400);
        },
        get serverError() {
            return new ApiError('errors.com.epicgames.internal.serverError', 'Sorry an error occurred and we were unable to resolve it.', 1000, 500);
        },
        get jsonParsingFailed() {
            return new ApiError('errors.com.epicgames.internal.jsonParsingFailed', 'Json parse failed.', 1020, 400);
        },
        get requestTimedOut() {
            return new ApiError('errors.com.epicgames.internal.requestTimedOut', 'Request timed out.', 1001, 408);
        },
        get unsupportedMediaType() {
            return new ApiError('errors.com.epicgames.internal.unsupportedMediaType', 'Sorry, your request could not be processed because you provide a type of media that we do not support.', 1006, 415);
        },
        get notImplemented() {
            return new ApiError('errors.com.epicgames.internal.notImplemented', 'The resource you were trying to access is not yet implemented by the server.', 1001, 501);
        },
        get dataBaseError() {
            return new ApiError('errors.com.epicgames.internal.dataBaseError', 'There was an error while interacting with the database. Please report this issue.', 1001, 500);
        },
        get unknownError() {
            return new ApiError('errors.com.epicgames.internal.unknownError', 'Sorry an error occurred and we were unable to resolve it.', 1001, 500);
        },
        get eosError() {
            return new ApiError('errors.com.epicgames.internal.EosError', 'Sorry an error occurred while communication with Epic Online Service Servers.', 1001, 500);
        }
    },
    basic: {
        get badRequest() {
            return new ApiError('errors.com.epicgames.basic.badRequest', 'Sorry but your request is invalid.', 1001, 400);
        },
        get notFound() {
            return new ApiError('errors.com.epicgames.basic.notFound', 'the resource you were trying to find could not be found.', 1004, 404);
        },
        get notAcceptable() {
            return new ApiError('errors.com.epicgames.basic.notAcceptable', 'Sorry your request could not be processed as you do not accept the response type generated by this resource. Please check your Accept header.', 1008, 406);
        },
        get methodNotAllowed() {
            return new ApiError('errors.com.epicgames.basic.methodNotAllowed', 'Sorry the resource you were trying to access cannot be accessed with the HTTP method you used.', 1009, 405);
        },
        get jsonMappingFailed() {
            return new ApiError('errors.com.epicgames.basic.jsonMappingFailed', 'Json mapping failed.', 1019, 400);
        },
        get throttled() {
            return new ApiError('errors.com.epicgames.basic.throttled', 'Operation access is limited by throttling policy.', 1041, 429);
        }
    },
    customError(code: string, message: string, numericErrorCode: number, status: number) {
        return new ApiError(code, message, numericErrorCode, status);
    }
}