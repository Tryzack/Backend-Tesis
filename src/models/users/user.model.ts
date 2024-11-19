import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface UserTable {
	id: Generated<number>;
	username: string;
	image: string | null;
	fname: string;
	lname: string;
	biography: string | null;
	email: string;
	password: string;
	address: string | null;
	birth_date: Date | null;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UpdatedUser = Updateable<UserTable>;