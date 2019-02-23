import "reflect-metadata";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import User from "./User";

@Entity()
export default class AuthorizationToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(type => User, user => user.tokens)
  user: User;

  @Column()
  kind: "facebook" | "twitter" | "google";

  @Column()
  accessToken: string;
}
