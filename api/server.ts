import "reflect-metadata";
import * as express from "express";
import * as passport from "passport";
import * as bodyParser from "body-parser";
import { ApolloServer } from "apollo-server-express";
import { Container } from "typedi";
import * as TypeGraphQL from "type-graphql";
import * as TypeORM from "typeorm";
import * as auth from "./auth";

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
    const app = express();
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

    app.use(bodyParser.json());

    // Configure Auth + /graphql route authorization
    auth.setupStrategies();
    app.post("/api/signup", auth.signup);
    app.post("/api/login", auth.login);
    app.use("/api/graphql", (req, res, next) => {
      // Skip authorization for the playground
      if (process.env.NODE_ENV !== "production") {
        if (req.path.startsWith("/api/graphql/playground")) {
          return next();
        }
      }

      passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (user) {
          req.user = user;
          return next();
        }

        return res.status(401).json({ message: "Unauthorized." });
      })(req, res, next);
    });

    const schema = await buildSchema();
    const server = new ApolloServer({
      schema,
      context: ({ req }) => ({ user: req.user }),
      playground: {
        endpoint: "/api/graphql/playground",
        settings: {
          "editor.theme": "dark"
        }
      }
    });

    server.applyMiddleware({ app, path: "/api/graphql" });

    const port = process.env.PORT || DEFAULT_PORT;
    const listening = await app.listen(port);
    console.log(
      `Server is running, GraphQL Playground is available at http://localhost:${port}/api/graphql/playground`
    );

    return listening;
  } catch (err) {
    console.error(err);
  }
}
