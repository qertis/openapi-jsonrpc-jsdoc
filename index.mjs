import jsdoc from 'jsdoc-api';

function extractName(name) {
  try {
    return name.match(/\.(.+)/i)[1]; //eslint-disable-line
  } catch {
    return name;
  }
}

function extractTypeName(names = []) {
  let typeName;
  if (names.length === 0) {
    typeName = 'null';
  } else if (names.length === 1) {
    [typeName] = names;
  } else {
    typeName = 'enum';
  }
  return typeName;
}

function isBigInt64(n) {
  try {
    const b = BigInt(n);
    return b >= -9223372036854775808n && b <= 9223372036854775807n;
  } catch {
    return false;
  }
}

function resolveSchemaFromTypeNames(names) {
  let type;
  let format;
  let items;
  let nullable;
  let constant;
  let enumData;

  switch (extractTypeName(names)) {
    case 'Array.<string>': {
      type = 'array';
      items = {type: 'string'};
      break;
    }
    case 'Array.<bigint>': {
      type = 'array';
      items = {
        type: 'integer',
        format: 'int64',
      };
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
      enumData = enumData.map((n) => {
        if (!Number.isNaN(Number(n))) {
          return Number(n);
        } else if (isBigInt64(n)) {
          return n;
        }
        return String(n);
      });

      if (enumData.every(n => Number.isSafeInteger(n))) {
        type = 'integer';
      } else if (enumData.every(n => Number.isInteger(n))) {
        type = 'number';
        format = 'float';
      } else if (enumData.every(n => typeof n === 'number' && n === Math.fround(n))) {
        type = 'number';
        format = 'double';
      } else  if (enumData.every(n => isBigInt64(n))) {
        type = 'integer';
        format = 'int64';
      } else if (enumData.every(n => !Number.isNaN(Number(n)))) {
        type = 'number';
      } else if (enumData.every(n => n?.toLowerCase() === 'boolean')) {
        type = 'boolean';
      } else if (enumData.every(n => n?.toLowerCase() === 'number')) {
        type = 'number';
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
      } else if (enumData.every(n => typeof n === 'string')) {
        type = 'string';
      } else if (enumData.length === 1) {
        type = enumData[0];
        constant = true;
      } else {
        type = undefined;
      }

      if (enumData?.length === 1) {
        if (!format) {
          [format] = enumData;
        }
        enumData = undefined;
      } else if (nullable) {
        enumData.push(null);
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
    nullable,
    items,
    constant,
    enumData,
  };
}

export default async function openapiJsonrpcJsdoc({
  openapi = '3.1.0',
  encoding = 'utf8',
  access = 'public',
  files,
  info = {},
  securitySchemes = {},
  packageUrl,
  servers,
  api = '/',
  samples = ['node', 'javascript'],
  ...xHeaders
}) {
  const options = {
    access,
    encoding,
    samples,
    files: Array.isArray(files) ? files : [files],
    undocumented: false,
    allowUnknownTags: true,
    dictionaries: ['jsdoc'],
  };
  if (info.title) {
    options.cache = true;
  } else {
    options.package = packageUrl;
  }
  let documents;
  if (options.cache) {
    documents = await jsdoc.explain(options);
  } else {
    const allData = await jsdoc.explain(options);
    documents = allData.filter(item => item.kind !== 'package');
    const package_ = allData.find(item => item.kind === 'package');
    info.version = package_.version;
    info.title = package_.name;
    info.description = package_.description;
  }
  if (!info.title) {
    throw new Error('API title is required. Please set packageUrl or info object.');
  }
  const temporaryDocument = {
    'openapi': openapi,
    'x-samples-enabled': samples.length > 0,
    'x-samples-languages': samples,
    ...xHeaders,
    'info': info,
    'servers': servers,
    'paths': {},
    'components': {
      securitySchemes,
      schemas: {
        Error: {
          type: 'object',
          required: [
            'error',
            'id',
            'jsonrpc',
          ],
          properties: {
            id: {
              type: ['string', 'integer'],
            },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'integer',
                  default: -32001,
                },
                message: {
                  type: 'string',
                },
              },
            },
            jsonrpc: {
              type: 'string',
              default: '2.0',
            },
          },
        },
      }
    },
    'security': Object.keys(securitySchemes).map(val => ({ [val]: [] })),
    'tags': [],
  };
  const requiredSchema = ['method', 'jsonrpc'];
  prepare: for (const module of documents) {
    let isJsonRpc = false;
    const tags = new Set();

    if (module.tags && Array.isArray(module.tags)) {
      for (const {title, originalTitle, value} of module.tags) {
        if (title === 'json-rpc') {
          isJsonRpc = true;
        } else if (value && ['tags', 'tag'].includes(originalTitle ?? title)) {
          value.split(',').map(t => t.trim()).forEach(t => tags.add(t));
        }
      }
    }
    if (!isJsonRpc) {
      continue prepare;
    }
    const {filename} = module.meta;
    const apiName = filename.replace(/\.js$/, '');

    let resultValues;
    switch (module.returns?.[0]?.description) {
      case 'Promise<*>':
      case 'Promise<object>': {
        resultValues = 'object';
        break;
      }
      default: {
        resultValues = '';
        break;
      }
    }

    let description = module.description;
    if (module.todo?.length) {
      description += '\n\nTODO: ' + module.todo.join();
    }

    const schema = {
      post: {
        operationId: apiName,
        deprecated: module.deprecated || false,
        summary: module.summary ?? `/${apiName}`,
        description: description,
        tags: Array.from(tags),
        responses: {
          '200': {
            description: 'OK response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: {
                      type: resultValues,
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Unexpected error',
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
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: requiredSchema,
                properties: {
                  method: {
                    type: 'string',
                    'default': apiName,
                    description: `API method header`,
                  },
                  id: {
                    type: ['string', 'integer'],
                    default: 'swagger_unique_indentifier',
                    description: 'Request ID header',
                  },
                  jsonrpc: {
                    type: 'string',
                    default: '2.0',
                    description: 'JSON-RPC 2.0 header',
                  },
                },
              },
            },
          },
        },
      },
    };
    if (module.params) {
      const prevObject = {};
      if (module.examples?.length) {
        const exampleJSON = JSON.parse(module.examples[0]);
        if (exampleJSON) {
          prevObject['default'] = exampleJSON;
        }
      }

      const propertiesParameters = module.params.reduce(
        (accumulator, parameter) => {
          if (parameter.name.startsWith('_')) {
            return accumulator;
          }
          if (!parameter.type) {
            throw new Error('JSDoc parameter error: ' + apiName);
          }
          // если главный параметр объявлен как объект - пропускаем его
          if (parameter.type.names.every(name => name.toLowerCase() === 'object')) {
            return accumulator;
          }
          const isPlain = !parameter.name.includes('.');

          const name = extractName(parameter.name);
          const prop = {};
          const description = parameter.description;
          let defaultValue = parameter.defaultvalue;

          const {
            items,
            constant,
            enumData,
            type,
            format,
            nullable,
          } = resolveSchemaFromTypeNames(parameter.type.names)
          if (!parameter.optional) {
            if (!accumulator.required) {
              accumulator.required = [];
            }
            accumulator.required.push(name);
          }
          if (nullable) {
            prop.nullable = nullable;
          }
          if (defaultValue !== undefined) {
            // fix for array type if it is not properly closed in JSDoc
            if (typeof defaultValue === 'string' && defaultValue.startsWith('[') && !defaultValue.endsWith(']')) {
              defaultValue += ']';
            }
            prop.default = JSON.parse(defaultValue);
          }
          if (constant) {
            prop.const = constant;
          }
          if (format) {
            prop.format = format;
          }
          if (enumData) {
            prop.enum = enumData;
          }
          if (type) {
            prop.type = type;
          }
          if (description) {
            prop.description = description;
          }
          if (items) {
            prop.items = items;
          }
          if (isPlain) {
            accumulator = Object.assign(accumulator, prop);
          } else if (accumulator.properties) {
            accumulator.properties[name] = prop;
          } else {
            accumulator.properties = {
              [name]: prop,
            };
          }

          return accumulator;
        },
        prevObject,
      );
      if (Object.keys(propertiesParameters).length) {
        const schemaPostJsdoc = schema.post.requestBody.content['application/json'].schema;
        if (propertiesParameters.properties) {
          schemaPostJsdoc.properties.params = {
            type: 'object',
            ...propertiesParameters,
          };
        } else {
          schemaPostJsdoc.properties.params = propertiesParameters;
        }
      }
    }
    temporaryDocument.paths[`${api}${apiName}`] = schema;
  }
  return temporaryDocument;
}
