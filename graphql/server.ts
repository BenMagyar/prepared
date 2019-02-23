import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { Container } from "typedi";
import * as TypeGraphQL from "type-graphql";
import * as TypeORM from "typeorm";

const DEFAULT_PORT = 4000;

// Entities
import AuthorizationToken from "../shared/entities/AuthorizationToken";
import User from "../shared/entities/User";

// Resolvers
import UserResolver from "./resolvers/UserResolver";

// Register 3rd party IoC container
TypeORM.useContainer(Container);
TypeGraphQL.useContainer(Container);

export async function buildSchema() {
  return TypeGraphQL.buildSchema({
    resolvers: [UserResolver]
  });
}

export async function start() {
  try {
    await TypeORM.createConnection({
      type: "mysql",
      database: process.env.MYSQL_DATABASE,
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      port: 3306,
      host: process.env.MYSQL_HOST,
      entities: [AuthorizationToken, User],
      synchronize: true,
      logger: "advanced-console",
      logging: ["warn", "error"],
      dropSchema: process.env.RECREATE === "true"
    });

    const schema = await buildSchema();
    const server = new ApolloServer({ schema });

    const { url } = await server.listen(process.env.PORT || DEFAULT_PORT);
    console.log(`Server is running, GraphQL Playground is available at ${url}`);

    return server;
  } catch (err) {
    console.error(err);
  }
}
