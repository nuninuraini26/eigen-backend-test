export class GenericError extends Error {
    statusCode: number
    constructor() {
        super()
        this.name = "GenericError"
        this.statusCode = 500
    }
}

export class BadRequestError extends Error {
    statusCode: number
    constructor(message: string) {
        super(message)
        this.name = "BadRequestError"
        this.statusCode = 400
    }
}

export class NotFoundError extends Error {
    statusCode: number
    constructor(message?: string) {
        super(message)
        this.name = "NotFoundError"
        this.statusCode = 404
    }
}

export class ForbiddenError extends Error {
    statusCode: number
    constructor() {
        super()
        this.name = "ForbiddenError"
        this.statusCode = 403
    }
}

export class UnauthorizedError extends Error {
    statusCode: number
    constructor() {
        super()
        this.name = "UnauthorizedError"
        this.statusCode = 401
    }
}
