import jsdoc from 'jsdoc-api';

function extractName(name) {
  try {
    return name.match(/\.(.+)/i)[1]; //eslint-disable-line
  } catch {
    return name;
  }
}

function resolveSchemaFromTypeNames(names) {
  let type;
  let format;
  let items;
  let oneOf;
  let nullable;
  let constant;
  let enumData;

  if (names.length === 0) {
    type = 'null';
  } else if (names.length === 1) {
    [type] = names;
  } else {
    type = 'enum';
  }

  switch (type) {
    case 'Array.<string>': {
      type = 'array';
      items = {type: 'string'};
      break;
    }
    case 'Array.<number>': {
      type = 'array';
      items = {type: 'number'};
      break;
    }
    case 'URL': {
      type = 'string';
      format = 'url';
      break;
    }
    case 'String':
    case 'string': {
      type = 'string';
      break;
    }
    case 'Number':
    case 'number': {
      type = 'number';
      break;
    }
    case 'Boolean':
    case 'boolean': {
      type = 'boolean';
      break;
    }
    case 'Date': {
      type = 'string';
      format = 'date-time';
      break;
    }
    case 'enum': {
      enumData = names;
      if (enumData.includes('null')) {
        nullable = true;
        enumData = enumData.filter(n => n !== 'null');
      }
      oneOf = enumData.map((n) => {
        if (!Number.isNaN(Number(n))) {
          return Number(n);
        }
        return n;
      });

      if (enumData.every(n => Number.isInteger(Number(n)))) {
        type = 'integer';
      } else if (enumData.every(n => !Number.isNaN(Number(n)))) {
        type = 'number';
      } else if (enumData.every(n => n?.toLowerCase() === 'boolean')) {
        type = 'boolean';
      } else if (enumData.every(n => n?.toLowerCase() === 'number')) {
        type = 'number';
      } else if (enumData.every(n => n?.toLowerCase() === 'string')) {
        type = 'string';
      } else if (enumData.every(n => n?.toLowerCase() === 'date')) {
        type = 'string';
        format = 'date-time';
      } else if (enumData.every(n => n === 'URL')) {
        type = 'string';
        format = 'url';
      } else if (enumData.every(n => n?.toLowerCase() === 'true')) {
        type = 'boolean';
        constant = true;
      } else if (enumData.every(n => n?.toLowerCase() === 'false')) {
        type = 'boolean';
        constant = false;
      } else {
        type = 'string';
      }

      if (enumData?.length === 1 && oneOf?.length === 1) {
        if (enumData[0] === oneOf[0]) {
          if (!format) {
            [format] = enumData;
          }
          oneOf = undefined;
          enumData = undefined;
        }
      }
      break;
    }
    default: {
      break;
    }
  }

  return {
    type,
    format,
    oneOf,
    nullable,
    items,
    constant,
    enumData,
  };
}

export default async function openapiJsonrpcJsdoc({ files, securitySchemes = {}, packageUrl, servers, api = '/' }) {
  const allData = await jsdoc.explain({
    files: Array.isArray(files) ? files : [files],
    package: packageUrl,
    access: 'public',
    encoding: 'utf8',
    undocumented: false,
    allowUnknownTags: true,
    dictionaries: ['jsdoc'],
  });
  const package_ = allData.find(item => item.kind === 'package');
  const documents = allData.filter(item => item.kind !== 'package');
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
            'error',
            'id',
            'jsonrpc',
          ],
          properties: {
            id: {
              type: 'integer',
              format: 'int32',
            },
            error: {
              type: 'object',
            },
            jsonrpc: {
              type: 'string',
            },
          },
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
    const tags = new Set();

    if (module.tags && Array.isArray(module.tags)) {
      for (const {title, value} of module.tags) {
        if (title === 'json-rpc') {
          isJsonRpc = true;
        } else if (value && ['tags', 'tag'].includes(title)) {
          value.split(',').map(t => t.trim()).forEach(t => tags.add(t));
        }
      }
    }
    if (!isJsonRpc) {
      continue prepare;
    }
    const {filename} = module.meta;
    const apiName = filename.replace(/\.js$/, '');

    const schema = {
      post: {
        operationId: filename,
        deprecated: module.deprecated || false,
        summary: `/${apiName}`,
        description: module.description,
        tags: Array.from(tags),
        parameters: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
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
          if (parameter.name.startsWith('_')) {
            return accumulator;
          }
          if (!parameter.type) {
            throw new Error('JSDoc parameter error: ' + apiName);
          }
          // todo поддержать не только object поле в аргументе функции
          if (parameter.type.names[0] === 'object') {
            return accumulator;
          }

          const description = parameter.description;
          const name = extractName(parameter.name);
          accumulator.properties[name] = accumulator.properties[name] ?? {};

          const {
            items,
            constant,
            enumData,
            type,
            format,
            oneOf,
            nullable,
          } = resolveSchemaFromTypeNames(parameter.type.names)
          if (!parameter.optional) {
            accumulator.required.push(name);
          }
          if (nullable) {
            accumulator.properties[name].nullable = nullable;
          }
          if (constant) {
            accumulator.properties[name].const = constant;
          }
          if (format) {
            accumulator.properties[name].format = format;
          }
          if (enumData) {
            accumulator.properties[name].enum = enumData;
          }
          if (oneOf) {
            accumulator.properties[name].oneOf = oneOf;
          }
          if (type) {
            accumulator.properties[name].type = type;
          }
          if (description) {
            accumulator.properties[name].description = description;
          }
          if (items) {
            accumulator.properties[name].items = items;
          }
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
      if (exampleJSON !== null) {
        const schemaPostJsdoc = schema.post.requestBody.content['application/json'].schema;
        schemaPostJsdoc.properties.params = propertiesParameters;
      }
    }
    temporaryDocument.paths[`${api}${apiName}`] = schema;
  }
  return temporaryDocument;
}
