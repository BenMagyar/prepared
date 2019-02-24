import "reflect-metadata";
import { Field, ID, ObjectType } from "type-graphql";
import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
  AfterLoad,
  BeforeUpdate,
  BeforeInsert
} from "typeorm";
import * as bcrypt from "bcrypt";
import AuthorizationToken from "./AuthorizationToken";
import { IsEmail, MaxLength, MinLength } from "class-validator";
import { IsUniqueUserEmail } from "../validators/IsUniqueUserEmail";

const SALT_ROUNDS = 10;

@Entity()
@ObjectType()
export default class User {
  private passwordOnLoad?: string;

  @Field(type => ID)
  @PrimaryGeneratedColumn("uuid")
  readonly id: string;

  @Field()
  @Column({ unique: true })
  @IsEmail()
  @IsUniqueUserEmail()
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @MaxLength(255)
  nickname?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @MaxLength(255)
  name?: string;

  @Field()
  @Column({ default: false })
  confirmed: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @MinLength(8)
  password?: string;

  // Authorization NOT in GraphQL
  @Column({ nullable: true })
  facebook?: string;

  @Column({ nullable: true })
  twitter?: string;

  @Column({ nullable: true })
  google?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpiration?: Date;

  @OneToMany(
    type => AuthorizationToken,
    authorizationToken => authorizationToken.user
  )
  tokens: AuthorizationToken[];

  // Password auto-saving
  @AfterLoad()
  private loadPassword(): void {
    this.passwordOnLoad = this.password;
  }

  @BeforeUpdate()
  private async encryptPassword(): Promise<void> {
    if (this.passwordOnLoad !== this.password) {
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  }

  async comparePassword(guess: string): Promise<boolean> {
    return bcrypt.compare(guess, this.password);
  }
}
