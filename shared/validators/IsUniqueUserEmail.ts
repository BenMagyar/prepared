import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator
} from "class-validator";
import { getRepository } from "typeorm";
import User from "../entities/User";

@ValidatorConstraint({ async: true })
export class IsUniqueUserEmailConstraint
  implements ValidatorConstraintInterface {
  async validate(email: string, args: ValidationArguments) {
    const user = await getRepository(User).findOne({ email });
    if (user) {
      return false;
    }
    return true;
  }
}

export function IsUniqueUserEmail(
  validationOptions: ValidationOptions = {
    message: "Email $value is already in use, choose another."
  }
) {
  return function(object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueUserEmailConstraint
    });
  };
}
