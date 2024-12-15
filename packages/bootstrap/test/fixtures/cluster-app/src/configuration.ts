import { MainApp, Configuration, Inject, CommonJSFileDetector, AllConfig } from '@midwayjs/core';
import { join } from 'path';
import * as assert from 'assert';
import { RemoteConfigService } from './service/remoteConfigService';
import { getCurrentApplicationContext, getCurrentMainFramework, ILifeCycle, IMidwayApplication } from '@midwayjs/core';
import * as Web from '../../../../../web';
import * as Upload from '../../../../../upload';
import * as SocketIO from '../../../../../socketio';

@Configuration({
  importConfigs: [
    join(__dirname, './config')
  ],
  detector: new CommonJSFileDetector(),
  imports: [
    Web,
    SocketIO,
    Upload,
  ]
})
export class AutoConfiguration implements ILifeCycle {
  @AllConfig()
  prepareConfig;

  @Inject()
  configService: RemoteConfigService;

  @MainApp()
  app: IMidwayApplication;

  async onConfigLoad() {
    return this.configService.getRemoteConfig();
  }

  async onReady() {
    console.log('code run onReady');
    assert.ok(this.prepareConfig['prepare'] === 'remote data');
    assert.ok(this.prepareConfig['id'] === this.configService.innerData);
    assert.ok(getCurrentApplicationContext() === this.app.getApplicationContext());
    assert.ok((getCurrentMainFramework() as any).getNamespace() === 'egg');
  }
}
