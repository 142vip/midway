import { Configuration, MainApp, Inject } from '@midwayjs/core';
import { join } from 'path';
import { Framework } from '../../../../src';
import * as Validate from '../../../../../validate';
import { TestMiddleware } from './middleware/test';

@Configuration({
  importConfigs: [
    join(__dirname, './config'),
  ],
  imports: [
    Validate
  ],
})
export class ContainerConfiguration {

  @MainApp()
  app;

  @Inject()
  framework: Framework;

  async onReady() {
    this.framework.useMiddleware(async (ctx, next) => {
      await next();
    });

    this.framework.useMiddleware(TestMiddleware);
  }
}
