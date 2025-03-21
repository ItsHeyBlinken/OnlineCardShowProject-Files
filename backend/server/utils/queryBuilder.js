class QueryBuilder {
    constructor() {
        this.baseQuery = '';
        this.where = [];
        this.params = [];
        this.orderBy = [];
        this.limit = null;
        this.offset = null;
    }

    select(baseQuery) {
        this.baseQuery = baseQuery;
        return this;
    }

    addWhere(condition, ...params) {
        this.where.push(condition);
        this.params.push(...params);
        return this;
    }

    addOrderBy(column, direction = 'ASC') {
        this.orderBy.push(`${column} ${direction}`);
        return this;
    }

    setLimit(limit) {
        this.limit = limit;
        return this;
    }

    setOffset(offset) {
        this.offset = offset;
        return this;
    }

    build() {
        let query = this.baseQuery;
        
        if (this.where.length) {
            query += ` WHERE ${this.where.join(' AND ')}`;
        }
        
        if (this.orderBy.length) {
            query += ` ORDER BY ${this.orderBy.join(', ')}`;
        }
        
        if (this.limit !== null) {
            query += ` LIMIT $${this.params.length + 1}`;
            this.params.push(this.limit);
        }
        
        if (this.offset !== null) {
            query += ` OFFSET $${this.params.length + 1}`;
            this.params.push(this.offset);
        }

        return {
            text: query,
            values: this.params
        };
    }
}

module.exports = QueryBuilder; 