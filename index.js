const jsdocx = require('jsdoc-x');

async function openapiJsonrpcJsdoc({ files, securitySchemes = {}, packageUrl, servers, api = '/' }) {
  const [package_, ...documents] = await jsdocx.parse({
    files,
    package: packageUrl,
    access: 'public',
    encoding: 'utf8',
    module: true,
    undocumented: false,
    sort: 'scope',
    allowUnknownTags: true,
    dictionaries: ['jsdoc'],
    hierarchy: true,
  });
  const temporaryDocument = {
    'x-send-defaults': true,
    'openapi': '3.0.0',
    'x-api-id': 'json-rpc-example',
    'x-headers': [],
    'x-explorer-enabled': true,
    'x-proxy-enabled': true,
    'x-samples-enabled': true,
    'x-samples-languages': ['curl', 'node', 'javascript'],
    'info': {
      version: package_.version,
      title: package_.name,
      description: package_.description,
    },
    'servers': servers,
    'paths': {},
    'components': {
      securitySchemes,
      schemas: {
        Error: {
          required: [
            "error",
            "id",
            "jsonrpc"
          ],
          properties: {
            "id": {
              "type": "integer",
              "format": "int32"
            },
            "error": {
              "type": "object"
            },
            "jsonrpc": {
              "type": "string"
            }
          }
        },
      }
    },
    'security': [
      {
        BasicAuth: [],
      },
    ],
    'tags': [],
  };
  for (const module of documents) {
    const apiName = module.meta.filename.replace(/.js$/, '');
    const schema = {
      post: {
        operationId: `${module.meta.filename}`,
        deprecated: module.deprecated || false,
        summary: `/${apiName}`,
        description: module.description,
        tags: ['JSONRPC'],
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        },
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['method', 'id', 'jsonrpc'],
                properties: {
                  method: {
                    type: 'string',
                    default: apiName,
                    description: `API method ${apiName}`,
                  },
                  // todo делать разграничение для notification request (без id)
                  id: {
                    type: 'integer',
                    default: 1,
                    format: 'int32',
                    description: 'Request ID',
                  },
                  jsonrpc: {
                    type: 'string',
                    default: '2.0',
                    description: 'JSON-RPC Version (2.0)',
                  },
                },
              },
            },
          },
        },
      },
    };
    if (module.params) {
      const propertiesParameters = module.params.reduce(
        (accumulator, parameter) => {
          if (!parameter.type) {
            throw new Error('JSDOC parameter error: ' + apiName);
          }
          // todo поддержать не только object поле в аргументе функции
          if (parameter.type.names[0] === 'object') {
            return accumulator;
          }
          const [type] = parameter.type.names;
          const description = parameter.description;
          let name;
          try {
            name = parameter.name.match(/\.(.+)/i)[1]; //eslint-disable-line
          } catch {
            name = parameter.name;
          }
          accumulator.required.push(name);
          accumulator.properties = {
            ...accumulator.properties,
            [name]: {
              type,
              description,
            },
          };
          return accumulator;
        },
        {
          title: 'Parameters',
          type: 'object',
          'default': module.examples.length ? JSON.parse(module.examples[0]) : null,
          required: ['method', 'id', 'jsonrpc'],
          properties: {},
        },
      );
      schema.post.requestBody.content['application/json'].schema.required.push(
        'params',
      );
      schema.post.requestBody.content[
        'application/json'
        ].schema.properties.params = propertiesParameters;
    }
    temporaryDocument.paths[`${api}${apiName}`] = schema;
  }
  return temporaryDocument;
}

module.exports = openapiJsonrpcJsdoc;
