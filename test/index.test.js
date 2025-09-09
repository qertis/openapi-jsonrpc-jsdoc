const test = require('ava');
const express = require('express');
const http = require('http');
const path = require('path');
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
  t.true(Array.isArray(v1Test.post.parameters));
  const v1RequestBodySchema = v1Test.post.requestBody.content['application/json'].schema;
  t.is(v1RequestBodySchema.type, 'object');
  t.true(v1RequestBodySchema.required.includes('id'));
});

test('t2', t => {
  const data = t.context.data;
  const v2Test = data.paths['/api/v2'];
  t.true(v2Test.post.deprecated);
});

test('optional parameters support', t => {
  const data = t.context.data;
  const testOptionalApi = data.paths['/api/test-optional'];
  t.false(testOptionalApi.post.deprecated);
  
  const paramsSchema = testOptionalApi.post.requestBody.content['application/json'].schema.properties.params;
  
  // Check that required parameter is in required array
  t.true(paramsSchema.required.includes('required_param'), 'required_param should be in required array');
  
  // Check that optional parameters are NOT in required array
  t.false(paramsSchema.required.includes('optional_param'), 'optional_param should NOT be in required array');
  t.false(paramsSchema.required.includes('another_optional'), 'another_optional should NOT be in required array');
  
  // Check that all parameters are present in properties
  t.true('required_param' in paramsSchema.properties, 'required_param should be in properties');
  t.true('optional_param' in paramsSchema.properties, 'optional_param should be in properties');
  t.true('another_optional' in paramsSchema.properties, 'another_optional should be in properties');
  
  // Verify the types are correct
  t.is(paramsSchema.properties.required_param.type, 'string');
  t.is(paramsSchema.properties.optional_param.type, 'number');
  t.is(paramsSchema.properties.another_optional.type, 'boolean');
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
