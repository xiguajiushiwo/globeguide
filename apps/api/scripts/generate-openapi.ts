import { mkdir, writeFile } from 'node:fs/promises';

import { SwaggerModule } from '@nestjs/swagger';

import { createApp } from '../src/main.js';

const app = await createApp();
const document = SwaggerModule.createDocument(app, {
  openapi: '3.0.0',
  info: {
    title: 'Wayella API',
    description: 'Global travel information and trip planning API',
    version: '0.1.0',
  },
});

await mkdir('openapi', { recursive: true });
await writeFile('openapi/openapi.json', JSON.stringify(document, null, 2) + '\n');
await app.close();
