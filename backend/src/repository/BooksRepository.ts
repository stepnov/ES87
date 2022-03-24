import { EntityRepository, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dayjs from 'dayjs';

import { Books } from '../entity/Books';
import { applyFilters, EntityQuery } from './utils';

@EntityRepository(Books)
export class BooksRepository extends Repository<Books> {

    filter(query: EntityQuery<Books> | undefined, page: number, size: number): Promise<[Books[], number]> {
        const qb = this.createQueryBuilder('e');
        applyFilters(qb, query);
        return qb
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();
    }
}
