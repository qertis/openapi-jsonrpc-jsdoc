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
  const tags = new Set();
  const temporaryDocument = {
    'x-send-defaults': true,
    'openapi': '3.0.0',
    'x-api-id': 'json-rpc-example',
    'x-headers': [],
    'x-explorer-enabled': true,
    'x-proxy-enabled': true,
    'x-samples-enabled': true,
    'x-samples-languages': ['node', 'javascript'],
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
  const requiredSchema = ['method', 'jsonrpc'];
  prepare: for (const module of documents) {
    let isJsonRpc = false;

    if (module.tags && Array.isArray(module.tags)) {
      for (const {title, value} of module.tags) {
        if (title === 'json-rpc') {
          isJsonRpc = true;
        } else if (title === 'tags' && value) {
          value.split(',').map(t => t.trim()).forEach(t => tags.add(t));
        }
      }
    }
    if (!isJsonRpc) {
      continue prepare;
    }
    const apiName = module.meta.filename.replace(/.js$/, '');

    const schema = {
      post: {
        operationId: `${module.meta.filename}`,
        deprecated: module.deprecated || false,
        summary: `/${apiName}`,
        description: module.description,
        tags: Array.from(tags),
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
                required: requiredSchema,
                properties: {
                  method: {
                    type: 'string',
                    default: apiName,
                    description: `API method ${apiName}`,
                  },
                  id: {
                    type: 'integer',
                    default: 1,
                    format: 'int32',
                    description: 'Request ID',
                  },
                  jsonrpc: {
                    type: 'string',
                    default: '2.0',
                    description: 'JSON-RPC 2.0 protocol',
                  },
                },
              },
            },
          },
        },
      },
    };
    if (module.params) {
      let exampleJSON = null;
      if (module.examples?.length) {
        exampleJSON = JSON.parse(module.examples[0]);
      }

      const propertiesParameters = module.params.reduce(
        (accumulator, parameter) => {
          if (!parameter.type) {
            throw new Error('JSDoc parameter error: ' + apiName);
          }
          // todo поддержать не только object поле в аргументе функции
          if (parameter.type.names[0] === 'object') {
            return accumulator;
          }
          let type;
          if (parameter.type.names.length === 0) {
            type = 'null';
          } else if (parameter.type.names.length === 1) {
            type = parameter.type.names[0];
          } else {
            type = 'enum';
          }
          let items;
          let enumData;
          switch (type) {
            case 'Array.<string>': {
              type = 'array';
              items = { type: 'number' };
              break;
            }
            case 'Array.<number>': {
              type = 'array';
              items = { type: 'string' };
              break;
            }
            case 'enum': {
              enumData = parameter.type.names;
              if (parameter.type.names.every(n => !Number.isNaN(Number(n)))) {
                type = 'number';
              } else {
                type = 'string';
              }
              break;
            }
            default: {
              break;
            }
          }
          const description = parameter.description;
          let name;
          try {
            name = parameter.name.match(/\.(.+)/i)[1]; //eslint-disable-line
          } catch {
            name = parameter.name;
          }
          if (!parameter.optional) {
            accumulator.required.push(name);
          }
          accumulator.properties = {
            ...accumulator.properties,
            [name]: {
              type,
              description,
              items,
              enum: enumData,
            },
          };
          return accumulator;
        },
        {
          title: 'Parameters',
          type: 'object',
          'default': exampleJSON,
          required: [],
          properties: {},
        },
      );
      const schemaPostJsdoc = schema.post.requestBody.content['application/json'].schema;
      schemaPostJsdoc.properties.params = propertiesParameters;
    }
    temporaryDocument.paths[`${api}${apiName}`] = schema;
  }
  return temporaryDocument;
}

module.exports = openapiJsonrpcJsdoc;
