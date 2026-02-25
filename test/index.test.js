import test from 'ava';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiJSONRpcJSDoc from '../index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const apiSpec = path.join(__dirname, './fixture/api.json');

test.before(async t => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.text());
  app.use(express.json());
  app.use('/spec', express.static(apiSpec));

  app.post('/api/api-v1', (req, res) => {
    res.send('pong');
  })

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  });

  t.context.server = app.listen(0);

  t.context.data = await openapiJSONRpcJSDoc({
    api: '/api/',
    securitySchemes: {
      BasicAuth: {
        type: 'http',
        scheme: 'digest',
      },
    },
    servers: [
      {
        url: 'http://0.0.0.0:' + t.context.server.address().port,
      },
    ],
    packageUrl: path.resolve('./package.json'),
    files: './test/api/*.js',
  });
});

test.after.always(t => {
  if (t.context.server) {
    t.context.server.close();
  }
});

test('t1', t => {
  const data = t.context.data;
  const v1Test = data.paths['/api/v1'];
  t.false(v1Test.post.deprecated);
  t.is(typeof v1Test.post.description, 'string');
  t.true(Array.isArray(v1Test.post.tags));
  t.deepEqual(v1Test.post.tags, Array.from(new Set(v1Test.post.tags)));
  t.true(Array.isArray(v1Test.post.parameters));
  const v1RequestBodySchema = v1Test.post.requestBody.content['application/json'].schema;
  t.is(v1RequestBodySchema.properties.params.properties.test.type, 'string');
  t.is(v1RequestBodySchema.properties.params.properties.array.type, 'array');
  t.is(v1RequestBodySchema.type, 'object');
  t.true(v1RequestBodySchema.required.includes('method'));
});

test('t2', t => {
  const data = t.context.data;
  const v2Test = data.paths['/api/v2'];
  t.true(v2Test.post.deprecated);
});

test('openapi validator', async (t) => {
  t.timeout(10000);
  const data = '{"jsonrpc":"2.0","method":"ping","id":1}';

  const response = await fetch(`http://127.0.0.1:${t.context.server.address().port}/api/api-v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length.toString(),
    },
    body: data,
  });
  if (response.status >= 400) {
    t.fail('Status Code: ' + response.status);
    return;
  }
  const result = await response.text();
  t.is('pong', result);
});
