import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export interface ValidationConfig {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
    options?: Joi.ValidationOptions;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export declare class RequestValidator {
    private defaultOptions;
    constructor(options?: Joi.ValidationOptions);
    /**
     * Main validation middleware factory
     */
    validate: (config: ValidationConfig) => (req: Request, res: Response, next: NextFunction) => any;
    private formatJoiErrors;
}
export declare const commonSchemas: {
    pagination: any;
    userId: any;
    campaign: {
        create: any;
        update: any;
    };
    podcast: {
        create: any;
        update: any;
    };
    rtb: {
        bidRequest: any;
        bidResponse: any;
    };
    analytics: {
        event: any;
        batchEvents: any;
    };
    audio: {
        insertionRequest: any;
    };
    auth: {
        register: any;
        login: any;
        resetPassword: any;
        changePassword: any;
    };
};
export declare const createValidator: (options?: Joi.ValidationOptions) => RequestValidator;
export declare const validators: {
    requireAuth: (req: Request, res: Response, next: NextFunction) => any;
    requireApiKey: (req: Request, res: Response, next: NextFunction) => any;
    pagination: (req: Request, res: Response, next: NextFunction) => any;
    validateId: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => any;
};
//# sourceMappingURL=validation.d.ts.map