import "reflect-metadata";
import { Resolver, Query, Arg, Mutation } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import User from "../../shared/entities/User";
import { validate, ValidationError } from "class-validator";
import NewUserInput from "../../shared/inputs/NewUserInput";

@Resolver(User)
export default class UserResolver {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  @Query(returns => User, { nullable: true })
  user(@Arg("id", type => String) id: string) {
    return this.userRepository.findOne(id);
  }

  @Mutation(returns => User)
  async createUser(@Arg("user", type => NewUserInput) user: NewUserInput) {
    return this.userRepository.save(user);
  }
}
