import { Schema, type } from '@colyseus/schema';

export class Currency extends Schema {
    constructor() {
        super();
        this.balance = 1000; // Starting balance
        this.transactions = [];
    }
}

type('number')(Currency.prototype, 'balance');
type('array')(Currency.prototype, 'transactions');

export class Transaction extends Schema {
    constructor(amount, type, description) {
        super();
        this.amount = amount;
        this.type = type; // 'bet', 'win', 'loss'
        this.description = description;
        this.timestamp = Date.now();
    }
}

type('number')(Transaction.prototype, 'amount');
type('string')(Transaction.prototype, 'type');
type('string')(Transaction.prototype, 'description');
type('number')(Transaction.prototype, 'timestamp'); 