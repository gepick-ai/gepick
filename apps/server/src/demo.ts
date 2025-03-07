import "reflect-metadata";
import { Module, ServiceContainer, ServiceModule, createServiceDecorator } from '@gepick/core/common';

class ServiceA {
  static readonly serviceId = Symbol.for("ServiceA");

  a() {
    // eslint-disable-next-line no-console
    console.log("a");
  }
}

export interface IServiceA {
  a: () => void
}
export const IServiceA = createServiceDecorator<IServiceA>(ServiceA.serviceId);

class ServiceB {
  static readonly serviceId = Symbol.for("ServiceB");

  constructor(@IServiceA private readonly serviceA: IServiceA) {}

  a() {
    this.serviceA.a();
  }

  b() {
    // eslint-disable-next-line no-console
    console.log("b");
  }
}
export interface IServiceB {
  a: () => void
  b: () => void
}
export const IServiceB = createServiceDecorator<IServiceB>(ServiceB.serviceId);

class ServiceC {
  static readonly serviceId = Symbol.for("ServiceC");

  constructor(@IServiceB private readonly serviceB: IServiceB) {}

  b() {
    this.serviceB.b();
  }
}

export interface IServiceC {
  b: () => void
}
export const IServiceC = createServiceDecorator<IServiceC>(ServiceC.serviceId);

@Module({
  services: [
    ServiceA,
    ServiceB,
  ],
})
class LoggerModule extends ServiceModule { }

@Module({
  services: [
    ServiceC,
  ],
})
class CommandModule extends ServiceModule { }

export const serviceContainer = new ServiceContainer([LoggerModule, CommandModule]);

const serviceB = serviceContainer.get<IServiceB>(ServiceB.serviceId);
serviceB.a()

const serviceC = serviceContainer.get<IServiceC>(ServiceC.serviceId);
serviceC.b()
