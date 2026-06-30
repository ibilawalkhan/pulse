import {
  isEmail,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { isSlackWebhookUrl } from './is-slack-webhook-url';

/** Validates an alert channel's `destination` according to its sibling `type`. */
@ValidatorConstraint({ name: 'isValidAlertDestination', async: false })
class IsValidAlertDestinationConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const type = (args.object as { type?: string }).type;
    if (type === 'EMAIL') {
      return typeof value === 'string' && isEmail(value);
    }
    if (type === 'SLACK_WEBHOOK') {
      return isSlackWebhookUrl(value);
    }
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const type = (args.object as { type?: string }).type;
    return type === 'SLACK_WEBHOOK'
      ? 'destination must be a Slack incoming webhook URL (https://hooks.slack.com/...)'
      : 'destination must be a valid email address';
  }
}

export function IsValidAlertDestination(options?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isValidAlertDestination',
      target: object.constructor,
      propertyName,
      options,
      validator: IsValidAlertDestinationConstraint,
    });
  };
}
