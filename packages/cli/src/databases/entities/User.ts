/* eslint-disable import/no-cycle */
import {
	BeforeUpdate,
	Column,
	ColumnOptions,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { IsEmail, Length } from 'class-validator';
import { IDataObject } from 'n8n-workflow';
import config = require('../../../config');
import { DatabaseType } from '../..';
import { Role } from './Role';
import { SharedWorkflow } from './SharedWorkflow';
import { SharedCredentials } from './SharedCredentials';

function resolveDataType(dataType: string) {
	const dbType = config.get('database.type') as DatabaseType;

	const typeMap: { [key in DatabaseType]: { [key: string]: string } } = {
		sqlite: {
			json: 'simple-json',
		},
		postgresdb: {
			datetime: 'timestamptz',
		},
		mysqldb: {},
		mariadb: {},
	};

	return typeMap[dbType][dataType] ?? dataType;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function getTimestampSyntax() {
	const dbType = config.get('database.type') as DatabaseType;

	const map: { [key in DatabaseType]: string } = {
		sqlite: "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')",
		postgresdb: 'CURRENT_TIMESTAMP(3)',
		mysqldb: 'CURRENT_TIMESTAMP(3)',
		mariadb: 'CURRENT_TIMESTAMP(3)',
	};

	return map[dbType];
}

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ length: 254 })
	@Index({ unique: true })
	@IsEmail()
	email: string;

	@Column({ length: 32 })
	@Length(1, 32, { message: 'First name must be 1 to 32 characters long.' })
	firstName: string;

	@Column({ length: 32 })
	@Length(1, 32, { message: 'Last name must be 1 to 32 characters long.' })
	lastName: string;

	@Column()
	password: string;

	@Column({ nullable: true })
	resetPasswordToken: string;

	@Column({
		type: resolveDataType('json') as ColumnOptions['type'],
		nullable: true,
	})
	personalizationAnswers: IDataObject;

	@ManyToOne(() => Role, (role) => role.globalForUsers, {
		cascade: true,
	})
	globalRole: Role;

	@OneToMany(() => SharedWorkflow, (sharedWorkflow) => sharedWorkflow.user)
	sharedWorkflows: SharedWorkflow[];

	@OneToMany(() => SharedCredentials, (sharedCredentials) => sharedCredentials.user)
	sharedCredentials: SharedCredentials[];

	@CreateDateColumn({ precision: 3, default: () => getTimestampSyntax() })
	createdAt: Date;

	@UpdateDateColumn({
		precision: 3,
		default: () => getTimestampSyntax(),
		onUpdate: getTimestampSyntax(),
	})
	updatedAt: Date;

	@BeforeUpdate()
	setUpdateDate(): void {
		this.updatedAt = new Date();
	}
}
