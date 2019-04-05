import * as passport from "passport";
import * as jwt from "jsonwebtoken";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { getRepository } from "typeorm";
import { Response, Request } from "express";
import { validate } from "class-validator";
import User from "../shared/entities/User";
import NewUserInput from "../shared/inputs/NewUserInput";

export function setupStrategies() {
  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      async (email, password, done) => {
        try {
          const userRepository = getRepository(User);
          const user = await userRepository.findOne({ email });
          if (!user.comparePassword(password)) {
            return done("Incorrect email or password.");
          }
          return done(null, user, { message: "Logged In Successfully" });
        } catch (err) {
          done(err);
        }
      }
    )
  );

  // JWT Strategy
  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
      },
      (payload, done) => {
        done(null, payload);
      }
    )
  );

  passport.initialize();
}

export async function signup(req: Request, res: Response) {
  try {
    const userInput = new NewUserInput();
    userInput.email = req.body["email"];
    userInput.password = req.body["password"];

    const errors = await validate(userInput);
    if (errors) {
      return res.status(400).json(errors);
    }

    const userRepository = getRepository(User);
    const user = userRepository.create(userInput);
    await userRepository.save(user);

    return res.send(201);
  } catch (err) {
    console.error(err);
    return res.send(500);
  }
}

export function login(req: Request, res: Response) {
  passport.authenticate(["local"], { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({ message: "Unable to login", user });
    }
    req.login(user, { session: false }, err => {
      if (err) {
        res.send(err);
      }

      const token = jwt.sign(user, process.env.JWT_SECRET);
      return res.json({ user, token });
    });
  })(req, res);
}
