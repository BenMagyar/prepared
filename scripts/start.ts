#!/usr/bin/env node
import chalk from "chalk";
import * as execa from "execa";
import * as dotenv from "dotenv";
import * as mysql from "mysql";
import * as TypeORM from "typeorm";
import { watch } from "chokidar";
import { join } from "path";
import { buildSchema, start as startServer } from "../graphql/server";

// .env configuration
dotenv.config();

// Default timeout for any one step
const TIMEOUT = 60;

async function queryAdminDatabase(query: string) {
  const connection = mysql.createConnection({
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  });

  return new Promise((resolve, reject) => {
    connection.query(query, error => {
      connection.end();
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
}

async function dropDatabase() {
  return queryAdminDatabase(
    `DROP DATABASE IF EXISTS ${process.env.MYSQL_DATABASE}`
  );
}

async function createDatabase() {
  return queryAdminDatabase(
    `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`
  );
}

async function startDatabase() {
  console.log(chalk`{blue Starting MySQL}...`);
  await execa.shell("docker-compose up -d");
  console.log(chalk`{blue Creating database}...`);
  await createDatabase();
}

async function watchServer() {
  console.log(chalk`{blue Watching GraphQL}...`);
  const server = await startServer();
  watch([join(__dirname, "../shared"), join(__dirname, "../graphql")], {
    ignored: join(__dirname, "../graphql/node_modules")
  }).on("change", async () => {
    try {
      const schema = await buildSchema();
      (server as any).schema = schema;
      console.log(chalk`{green Reloaded GraphQL}!`);
    } catch (err) {
      console.error(err);
    }
  });
}

async function watchClient() {}

async function start() {
  try {
    await startDatabase();
    await watchServer();
  } catch (err) {
    console.error(err);
  }
}

start();
