import { inject } from 'inversify';

// 加一个{ _serviceBrand?: 'ServiceIdentifier' }是为了屏蔽掉ServiceIdentifier展开的类型，而是在移入指定装饰器的时候将类型显示成ServiceIdentifier<IXXService>
// 加上{ _serviceBrand?: 'ServiceIdentifier' }并不会影响显示的具体类型，只是为了让类型显示成ServiceIdentifier<IXXService>
export type ServiceIdentifier<T = unknown> = ReturnType<typeof inject<T>> & { _serviceBrand?: undefined }; ;

export function createServiceDecorator<T = unknown>(serviceId: symbol): ServiceIdentifier<T> {
  return inject(serviceId) as ServiceIdentifier<T>
}

export type ServiceConstructor = (new (...args: any[]) => any) & { readonly serviceId: symbol };
