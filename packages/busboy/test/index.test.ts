import { createHttpRequest, createLightApp, close } from '@midwayjs/mock';
import * as koa from '@midwayjs/koa';
import { join } from 'path';
import { createWriteStream, statSync } from 'fs';
import * as assert from 'assert';
import { Controller, createMiddleware, Post } from '@midwayjs/core';
import { tmpdir } from 'os';
import { UploadMiddleware, UploadStreamFileInfo } from '../src';

describe('/test/index.test.ts', () => {
  it('should fix #3858 ', async () => {

    @Controller()
    class APIController {
      @Post('/upload', { middleware: [UploadMiddleware]})
      async upload(ctx) {
        const files = ctx.files as Array<UploadStreamFileInfo>;
        const fields = ctx.fields;
        const fileName = join(tmpdir(), Date.now() + '_' + files[0].filename);
        const fsWriteStream = createWriteStream(fileName);
        const fieldName = files[0].fieldName;

        await new Promise<void>(resolve => {
          fsWriteStream.on('close', resolve);
          files[0].data.pipe(fsWriteStream);
        });

        const stat = statSync(fileName);
        return {
          size: stat.size,
          files,
          fields,
          fieldName,
        }
      }
    }

    const app = await createLightApp({
      imports: [
        koa,
        require('../src')
      ],
      globalConfig: {
        keys: '123',
        busboy: {
          mode: 'stream',
          whitelist: ['.txt'],
        }
      },
      preloadModules: [
        APIController
      ]
    });

    const filePath = join(__dirname, 'resource/default.txt');
    const request = await createHttpRequest(app);

    // upload file 10 times
    for (let i = 0; i < 10; i++) {
      await request.post('/upload')
        .field('name', 'form')
        .attach('file12', filePath)
        .expect(200)
        .then(async response => {
          const stat = statSync(filePath);
          assert(response.body.size === stat.size);
          assert(response.body.files.length === 1);
          assert(response.body.files[0].filename === 'default.txt');
          assert(response.body.fields.name === 'form');
          assert(response.body.fieldName === 'file12');
        });
    }

    await close(app);
  });

  it('should test file limit in file mode', async () => {
    @Controller()
    class APIController {
      @Post('/upload', { middleware: [UploadMiddleware]})
      async upload(ctx) {
        // TODO
      }
    }

    const app = await createLightApp({
      imports: [
        koa,
        require('../src')
      ],
      globalConfig: {
        keys: '123',
        busboy: {
          mode: 'file',
          whitelist: ['.txt'],
          limits: {
            fileSize: 1,
          }
        }
      },
      preloadModules: [
        APIController
      ]
    });

    const filePath = join(__dirname, 'resource/default.txt');
    const request = await createHttpRequest(app);
    await request.post('/upload')
      .field('name', 'form')
      .attach('file', filePath)
      .expect(400);

    await close(app);
  });

  it('should test file limit in stream mode', async () => {
    @Controller()
    class APIController {
      @Post('/upload', { middleware: [UploadMiddleware]})
      async upload(ctx) {
        // throw error
        // const fs = createWriteStream(join(tmpdir(), ctx.files[0].filename));
        // ctx.files[0].data.pipe(fs);
        //
        // await new Promise(resolve => {
        //   fs.on('finish', resolve);
        // });
      }
    }

    const app = await createLightApp({
      imports: [
        koa,
        require('../src')
      ],
      globalConfig: {
        keys: '123',
        busboy: {
          mode: 'stream',
          whitelist: ['.txt'],
          limits: {
            fileSize: 1,
          }
        }
      },
      preloadModules: [
        APIController
      ]
    });

    const filePath = join(__dirname, 'resource/default.txt');
    const request = await createHttpRequest(app);
    await request.post('/upload')
      .field('name', 'form')
      .attach('file', filePath)
      .expect(400);

    await close(app);
  });

  it('should test different options with different route middleware', async () => {
    @Controller()
    class APIController {
      @Post('/upload', { middleware: [createMiddleware(UploadMiddleware, {mode: 'file'})]})
      async upload(ctx) {
        const stat = statSync(ctx.files[0].data);
        return {
          size: stat.size,
        }
      }

      @Post('/upload1', { middleware: [createMiddleware(UploadMiddleware, {mode: 'stream'})]})
      async upload1(ctx) {
        const fileName = join(tmpdir(), Date.now() + '_' + ctx.files[0].filename);
        const fsWriteStream = createWriteStream(fileName);

        await new Promise<void>(resolve => {
          fsWriteStream.on('close', resolve);
          ctx.files[0].data.pipe(fsWriteStream);
        });

        const stat = statSync(fileName);
        return {
          size: stat.size,
        }
      }
    }

    const app = await createLightApp({
      imports: [
        koa,
        require('../src')
      ],
      globalConfig: {
        keys: '123',
        busboy: {
          mode: 'stream',
          whitelist: ['.txt'],
        }
      },
      preloadModules: [
        APIController
      ]
    });

    const filePath = join(__dirname, 'resource/default.txt');
    const request = await createHttpRequest(app);
    await request.post('/upload')
      .field('name', 'form')
      .attach('file1', filePath)
      .expect(200);

    await request.post('/upload1')
      .field('name', 'form')
      .attach('file2', filePath)
      .expect(200);

    await close(app);
  });
});
