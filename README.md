# openapi-jsonrpc-jsdoc

## Install

```bash
npm i openapi-jsonrpc-jsdoc
```

## Examples

### Usage Example

```js
// api/api-v1.js
/**
 * @json-rpc
 * @description Название API
 * @param {object} parameters - params
 * @param {string} parameters.id - id
 * @param {string} [parameters.test] - test
 * @param {string[]} parameters.array - array
 * @param {1|2} parameters.num - enum
 * @tags api
 * @example
 * {
 *    "id": "https://www.w3.org/ns/activitystreams"
 * }
 */
module.exports = (parameters) => {
  return parameters.id;
};

```

### Generate OpenAPI JSON

```js
const openapiJSONRpcJSDoc = require('openapi-jsonrpc-jsdoc');
openapiJSONRpcJSDoc({
    api: '/',
    servers: [
        {
            url: '0.0.0.0:8080',
         },
    ],
    info: {
      title: 'Test API',
    },
    packageUrl: './package.json',
    files: './api/*.js',
}).then(data => {
  JSON.stringify(data, null, 2);// openapi.json
});
```

<details>
<summary>See Swagger result</summary>

```json
{
  "openapi": "3.1.0",
  "x-samples-enabled": true,
  "x-samples-languages": [
    "node",
    "javascript"
  ],
  "info": {
    "version": "1.4.3",
    "title": "Test API",
    "description": "Transform JSDoc-annotated JSON-RPC 2.0 methods into OpenAPI specifications."
  },
  "servers": [
    {
      "url": "http://0.0.0.0:9000"
    }
  ],
  "paths": {
    "/api/v1": {
      "post": {
        "operationId": "v1.js",
        "deprecated": false,
        "summary": "/v1",
        "description": "Название API",
        "tags": [
          "api"
        ],
        "parameters": [],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "method",
                  "jsonrpc"
                ],
                "properties": {
                  "method": {
                    "type": "string",
                    "description": "API method v1"
                  },
                  "id": {
                    "type": [
                      "string",
                      "integer"
                    ],
                    "description": "Request ID"
                  },
                  "jsonrpc": {
                    "type": "string",
                    "default": "2.0",
                    "description": "JSON-RPC 2.0 protocol"
                  },
                  "params": {
                    "title": "Parameters",
                    "type": "object",
                    "default": {
                      "@context": "https://www.w3.org/ns/activitystreams",
                      "type": "Note"
                    },
                    "required": [
                      "id",
                      "array",
                      "num"
                    ],
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "id"
                      },
                      "test": {
                        "type": "string",
                        "description": "test"
                      },
                      "array": {
                        "type": "array",
                        "description": "array",
                        "items": {
                          "type": "string"
                        }
                      },
                      "num": {
                        "enum": [
                          1,
                          2
                        ],
                        "type": "integer",
                        "description": "enum"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "BasicAuth": {
        "type": "http",
        "scheme": "basic"
      }
    },
    "schemas": {
      "Error": {
        "type": "object",
        "required": [
          "error",
          "id",
          "jsonrpc"
        ],
        "properties": {
          "id": {
            "type": [
              "string",
              "integer"
            ]
          },
          "error": {
            "type": "object"
          },
          "jsonrpc": {
            "type": "string",
            "default": "2.0"
          }
        }
      }
    }
  },
  "security": [
    {
      "BasicAuth": []
    }
  ],
  "tags": []
}
```

</details>
