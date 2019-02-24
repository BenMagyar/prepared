import "reflect-metadata";
import { Resolver, Query, Arg } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import User from "../../shared/entities/User";

@Resolver(User)
export default class UserResolver {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  @Query(returns => User, { nullable: true })
  user(@Arg("id", type => String) id: string) {
    return this.userRepository.findOne(id);
  }
}
