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
  const allData = await jsdoc.explain({
    files: Array.isArray(files) ? files : [files],
    packageJson: packageUrl,
    access,
    encoding,
    undocumented: false,
    allowUnknownTags: true,
    dictionaries: ['jsdoc'],
    cache: true,
    samples,
  });
  const package_ = allData.find(item => item.kind === 'package');
  const documents = allData.filter(item => item.kind !== 'package');
  const temporaryDocument = {
    'openapi': openapi,
    'x-samples-enabled': samples.length > 0,
    'x-samples-languages': samples,
    ...xHeaders,
    'info': {
      version: package_.version,
      title: package_.name,
      description: package_.description,
      ...info,
    },
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
  if (!temporaryDocument.info.title) {
    throw new Error('Info title is required');
  }
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
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: requiredSchema,
                properties: {
                  method: {
                    type: 'string',
                    description: `API method ${apiName}`,
                  },
                  id: {
                    type: ['string', 'integer'],
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

          const name = extractName(parameter.name);
          accumulator.properties[name] = accumulator.properties[name] ?? {};
          const description = parameter.description;
          const defaultValue = parameter.defaultvalue;

          const {
            items,
            constant,
            enumData,
            type,
            format,
            nullable,
          } = resolveSchemaFromTypeNames(parameter.type.names)
          if (!parameter.optional) {
            accumulator.required.push(name);
          }
          if (nullable) {
            accumulator.properties[name].nullable = nullable;
          }
          if (defaultValue) {
            accumulator.properties[name].default = defaultValue;
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
