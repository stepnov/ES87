import { FastifyInstance } from 'fastify'
import { getCustomRepository } from 'typeorm';
import * as TypeBox from '@sinclair/typebox';

import { BooksRepository } from '../repository/BooksRepository';
import { newBooksSchema, booksSchema } from '../entity/Books';

export const tag = 'Books';

export default async (app: FastifyInstance) => {
    const schema = TypeBox.Type.Object({
        q: TypeBox.Type.Optional(TypeBox.Type.Partial(booksSchema, { description: 'Filter query', additionalProperties: false })),
        page: TypeBox.Type.Number({ default: 1, minimum: 1, description: 'Page number' }),
        limit: TypeBox.Type.Number({ minimum: 0, maximum: 20, default: 10, description: 'Page size' }),
    }, {
        style: 'deepObject',
    });

    app.get<{ Querystring: TypeBox.Static<typeof schema> }>('/books', {
        // @ts-ignore
        preHandler: app.auth([app.verifyAuthorized]),
        schema: {
            querystring: schema,
            security: [{
                bearerAuth: [],
            }],
            tags: [tag],
            summary: 'List books',
        },
    }, async (req) => {
        // @ts-ignore
        const [items, count] = await getCustomRepository(BooksRepository).filter(req.query.q, req.query.page, req.query.limit);
        return {
            rows: items,
            count,
            isLastPage: (req.query.page + 1) * req.query.limit >= count,
        };
    });

    const postPayload = TypeBox.Type.Object({
        data: newBooksSchema,
    });
    app.post<{
        Body: TypeBox.Static<typeof postPayload>,
        Reply: TypeBox.Static<typeof booksSchema>
    }>('/books', {
        // @ts-ignore
        preHandler: app.auth([app.verifyAuthorized]),
        schema: {
            security: [{
                bearerAuth: [],
            }],
            tags: [tag],
            summary: 'Create new books',
            body: postPayload,
            response: {
                200: booksSchema,
                400: TypeBox.Type.Object({
                    statusCode: TypeBox.Type.Number({ default: 400 }),
                    error: TypeBox.Type.Optional(TypeBox.Type.String()),
                    message: TypeBox.Type.String(),
                }, { description: 'Validation error' }),
            },
        },
    }, async (req, reply) => {
        const repo = getCustomRepository(BooksRepository);
        return repo.save(req.body.data);
    });

    const find = TypeBox.Type.Object({
        id: TypeBox.Type.String({
            format: 'uuid',
        }),
    });

    app.get<{
        Params: TypeBox.Static<typeof find>,
        Reply: TypeBox.Static<typeof booksSchema>
    }>('/books/:id', {
        // @ts-ignore
        preHandler: app.auth([app.verifyAuthorized]),
        schema: {
            params: find,
            tags: [tag],
            summary: 'Get specific books',
            security: [{
                bearerAuth: [],
            }],
            response: {
                200: booksSchema,
                404: TypeBox.Type.Object({
                    statusCode: TypeBox.Type.Number({ default: 404 }),
                    error: TypeBox.Type.String({ default: 'Not Found' }),
                    message: TypeBox.Type.String(),
                }, { description: 'Books not found' }),
            },
        }
    // @ts-ignore
    }, async (req, reply) => {
        const entity = await getCustomRepository(BooksRepository).findOne({
            where: {
                id: req.params.id,
            },
        });

        return entity ? entity : reply.notFound('Books not found');
    });

    const putSchema = TypeBox.Type.Object({
        id: TypeBox.Type.String({ format: 'uuid' }),
        data: TypeBox.Type.Partial(newBooksSchema),
    });
    app.put<{
        Params: TypeBox.Static<typeof find>,
        Body: TypeBox.Static<typeof putSchema>,
    }>('/books/:id', {
        // @ts-ignore
        preHandler: app.auth([app.verifyAdmin]),
        schema: {
            summary: 'Edit existing books',
            params: find,
            body: putSchema,
            tags: [tag],
            security: [{
                bearerAuth: [],
            }],
        }
    }, async (req, reply) => {
        return getCustomRepository(BooksRepository).save({
            ...req.body.data,
            id: req.params.id,
        });
    });

    app.delete<{
        Params: TypeBox.Static<typeof find>,
    }>('/books/:id', {
        // @ts-ignore
        preHandler: app.auth([app.verifyAdmin]),
        schema: {
            description: 'Delete books',
            summary: 'Delete books',
            params: find,
            tags: [tag],
            security: [{
                bearerAuth: [],
            }],
            response: {
                200: {
                    description: 'books successfully deleted',
                    type: 'null',
                },
                404: TypeBox.Type.Object({
                    statusCode: TypeBox.Type.Number({ default: 404 }),
                    error: TypeBox.Type.String({ default: 'Not Found' }),
                    message: TypeBox.Type.String(),
                }, { description: 'books not found' }),
            },
        }
    }, async (req, reply) => {
        const entity = await getCustomRepository(BooksRepository).softDelete(req.params.id);
        if (!entity.affected) {
            reply.notFound('books not found');
            return;
        }

        reply.code(200).send();
    });
}
