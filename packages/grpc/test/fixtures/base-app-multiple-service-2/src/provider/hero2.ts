import { GrpcMethod, MSProviderType, Provider, Provide, Inject, Init } from '@midwayjs/core';
import { helloworld, hero2 } from '../interface';
import { Clients } from '../../../../../src';

@Provide()
@Provider(MSProviderType.GRPC, { package: 'hero2' })
export class HeroService2 implements hero2.HeroService2 {

  @Inject()
  grpcClients: Clients;

  greeterService: helloworld.GreeterClient;

  @Init()
  async init() {
    this.greeterService = this.grpcClients.getService<helloworld.GreeterClient>('helloworld.Greeter');
  }

  @GrpcMethod()
  async findOne2(data) {
    const result = await this.greeterService.sayHello().sendMessage({
      name: 'harry'
    });
    return {
      id: 1,
      name: 'bbbb-' + result.message,
    };
  }
}
