import { LazyServiceIdentifier } from '@inversifyjs/common';

import { UNDEFINED_INJECT_ANNOTATION } from '../constants/error_msgs';
import { interfaces } from '../interfaces/interfaces';
import { Metadata } from '../planning/metadata';
import { createTaggedDecorator, DecoratorTarget } from './decorator_utils';

export function injectBase(
  metadataKey: string,
): <T = unknown>(
  serviceIdentifier: interfaces.ServiceIdentifier<T> | LazyServiceIdentifier<T>,
) => (
  target: DecoratorTarget,
  targetKey?: string | symbol,
  indexOrPropertyDescriptor?: number | TypedPropertyDescriptor<T>,
) => void {
  return <T = unknown>(
    serviceIdentifier:
      | interfaces.ServiceIdentifier<T>
      | LazyServiceIdentifier<T>,
  ) => {
    return (
      target: DecoratorTarget,
      targetKey?: string | symbol,
      indexOrPropertyDescriptor?: number | TypedPropertyDescriptor<T>,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (serviceIdentifier === undefined) {
        const className: string =
          typeof target === 'function' ? target.name : target.constructor.name;

        throw new Error(UNDEFINED_INJECT_ANNOTATION(className));
      }

      createTaggedDecorator(new Metadata(metadataKey, serviceIdentifier))(
        target,
        targetKey,
        indexOrPropertyDescriptor,
      );
    };
  };
}
