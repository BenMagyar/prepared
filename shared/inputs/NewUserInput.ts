import "reflect-metadata";
import { InputType, Field } from "type-graphql";
import { IsEmail } from "class-validator";
import User from "../entities/User";
import { IsUniqueUserEmail } from "../validators/IsUniqueUserEmail";

@InputType()
export default class NewUserInput implements Partial<User> {
  @Field()
  @IsEmail()
  @IsUniqueUserEmail()
  email: string;
}
