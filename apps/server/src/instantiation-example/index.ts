import "reflect-metadata";
import { Module, ServiceContainer, ServiceModule } from '@gepick/core/common';
import { ServiceA } from './service-a';
import { ServiceB } from './service-b';
import { IServiceC, ServiceC } from './service-c';

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

async function main() {
  const serviceContainer = new ServiceContainer([LoggerModule, CommandModule]);

  const serviceC = serviceContainer.get<IServiceC>(ServiceC.getServiceDecorator());
  serviceC.b()

  // eslint-disable-next-line no-console
  console.log("loggerModule", LoggerModule.getServices())
  // eslint-disable-next-line no-console
  console.log("commandModule", CommandModule.getServices())

  // eslint-disable-next-line no-console
  console.log("serviceA contribution", ServiceA.isContribution())
  // eslint-disable-next-line no-console
  console.log("serviceA contributionId", ServiceA.getContributionId())

  // eslint-disable-next-line no-console
  console.log("serviceB contribution", ServiceB.isContribution())
  // eslint-disable-next-line no-console
  console.log("serviceB contributionId", ServiceB.getContributionId())
}

main()
