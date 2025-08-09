export abstract class DomainException extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationException extends DomainException {
    constructor(message: string) {
        super(message);
    }
}

export class NotFoundException extends DomainException {
    constructor(entity: string, id: string) {
        super(`${entity} with id ${id} not found`);
    }
}

export class BusinessRuleException extends DomainException {
    constructor(message: string) {
        super(message);
    }
}
