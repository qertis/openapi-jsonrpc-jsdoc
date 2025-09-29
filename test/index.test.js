const test = require('ava');
const express = require('express');
const http = require('node:http');
const path = require('node:path');
const OpenApiValidator = require('express-openapi-validator');
const openapiJSONRpcJSDoc = require('../index');

const port = 9000;
const app = express();
const apiSpec = path.join(__dirname, './fixture/api.json');

test.before(async t => {
  app.use(express.urlencoded({ extended: false }));
  app.use(express.text());
  app.use(express.json());
  app.use('/spec', express.static(apiSpec));

  app.use(
    OpenApiValidator.middleware({
      apiSpec,
      validateRequests: true,
      validateResponses: true,
    }),
  );

  app.post('/api/api-v1', (req, res) => {
    res.send('pong');
  })

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  });

  app.listen(port);

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
        url: 'http://0.0.0.0:' + port,
      },
    ],
    packageUrl: path.resolve('./package.json'),
    files: './test/api/*.js',
  });
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

test.cb('openapi validator', (t) => {
  t.timeout(10000);
  const data = '{"jsonrpc":"2.0","method":"ping","id":1}';

  const options = {
    hostname: '127.0.0.1',
    port: port,
    path: '/api/api-v1',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    }
  }
  const req = http.request(options, res => {
    let data = '';
    if (res.statusCode >= 400) {
      t.fail('Status Code:' + res.statusCode);
      return;
    }
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      t.is('pong', data);
      t.pass();
    })
  })
  .on('error', err => {
    t.fail(err.message);
  });
  req.write(data);
  req.end();
});
