const test = require('ava');
const openapiJSONRpcJSDoc = require('../index');

test.before(async t => {
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
        url: '0.0.0.0:8080',
      },
    ],
    packageUrl: './package.json',
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