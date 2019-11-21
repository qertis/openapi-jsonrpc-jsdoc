const test = require('ava');
const openapiJSONRpcJSDoc = require('../index');

test('t1', async (t) => {
  const data = await openapiJSONRpcJSDoc({
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
  t.false(data.paths['/api/v1'].post.deprecated);
  t.true(data.paths['/api/v2'].post.deprecated);
});

