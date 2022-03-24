import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    DeleteDateColumn,
    CreateDateColumn,
    UpdateDateColumn,

    JoinTable,
    ManyToMany,

    OneToOne,
    JoinColumn,

} from 'typeorm';
import * as TypeBox from '@sinclair/typebox';

import { Users, usersSchema } from './Users';

import { Tags, tagsSchema } from './Tags';

/**
 * Schema for books entity
 */
export const booksSchema = TypeBox.Type.Object({
    id: TypeBox.Type.String({ format: 'uuid' }),

        title: TypeBox.Type.String({ default: '' }),

        author: TypeBox.Type.Optional(usersSchema),

        tags: TypeBox.Type.Array(tagsSchema, { default: [] }),

});

/**
 * Schema for creating a new books
 */
export const newBooksSchema = TypeBox.Type.Omit(
    booksSchema,
    // remove metadata fields
    ['id'],
    { additionalProperties: false },
);

@Entity()
export class Books implements Omit<TypeBox.Static<typeof booksSchema>, 'author'> {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

        @Column({ default: '' })
        title!: string;

        @OneToOne(() => Users, { eager: true, cascade: true })
    @JoinColumn()
        author?: Users;

        @ManyToMany(() => Tags, { eager: true, cascade: true })
    @JoinTable({ name: 'books_tags_join' })
        tags!: Tags[];

}
