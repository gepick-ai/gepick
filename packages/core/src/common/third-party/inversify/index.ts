/* eslint-disable @typescript-eslint/naming-convention */
import 'reflect-metadata';

import { LazyServiceIdentifier } from '@inversifyjs/common';

import * as keys from './constants/metadata_keys';

export { LazyServiceIdentifier } from '@inversifyjs/common';

/**
 * @deprecated Use LazyServiceIdentifier instead
 */
export const LazyServiceIdentifer: typeof LazyServiceIdentifier =
  LazyServiceIdentifier;

// eslint-disable-next-line @typescript-eslint/typedef
export const METADATA_KEY = keys;
export { Container } from './container/container';
export {
  BindingScopeEnum,
  BindingTypeEnum,
  TargetTypeEnum,
} from './constants/literal_types';
export {
  AsyncContainerModule,
  ContainerModule,
} from './container/container_module';
export { createTaggedDecorator } from './annotation/decorator_utils';
export { injectable } from './annotation/injectable';
export { tagged } from './annotation/tagged';
export { named } from './annotation/named';
export { inject } from './annotation/inject';
export { optional } from './annotation/optional';
export { unmanaged } from './annotation/unmanaged';
export { multiInject } from './annotation/multi_inject';
export { targetName } from './annotation/target_name';
export { postConstruct } from './annotation/post_construct';
export { preDestroy } from './annotation/pre_destroy';
export { MetadataReader } from './planning/metadata_reader';
export { id } from './utils/id';
export type { interfaces } from './interfaces/interfaces';
export { decorate } from './annotation/decorator_utils';
export {
  traverseAncerstors,
  taggedConstraint,
  namedConstraint,
  typeConstraint,
} from './syntax/constraint_helpers';
export { getServiceIdentifierAsString } from './utils/serialization';
export { multiBindToService } from './utils/binding_utils';
