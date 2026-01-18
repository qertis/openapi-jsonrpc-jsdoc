# openapi-jsonrpc-jsdoc

## Install

```fish
npm i openapi-jsonrpc-jsdoc
```

## Examples

### Create JSON-RPC Method

```js
// api/api-v1.js
/**
 * @json-rpc
 * @description Название API
 * @param {object} parameters - params
 * @param {string} parameters.id - id
 * @example
 * {
 *    "@context": "https://www.w3.org/ns/activitystreams",
 *    "type": "Note"
 * }
 */
module.exports = (parameters) => {
    return parameters.id;
}
```

### Run package

```js
// index.js
const fs = require('fs');
const openapiJSONRpcJSDoc = require('openapi-jsonrpc-jsdoc');
openapiJSONRpcJSDoc({
    api: '/',
    servers: [
        {
            url: '0.0.0.0:8080',
         },
    ],
    packageUrl: './package.json',
    files: './api/*.js',
}).then(data => {
  fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));  
});
```

<details>
<summary>See Swagger result</summary>

```json
{
  "x-send-defaults": true,
  "openapi": "3.0.0",
  "x-api-id": "json-rpc-example",
  "x-headers": [],
  "x-explorer-enabled": true,
  "x-proxy-enabled": true,
  "x-samples-enabled": true,
  "x-samples-languages": [
    "curl",
    "node",
    "javascript"
  ],
  "info": {
    "version": "1.0.4",
    "title": "openapi-jsonrpc-jsdoc",
    "description": "OpenAPI generator"
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
          "JSONRPC"
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
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "method",
                  "id",
                  "jsonrpc",
                  "params"
                ],
                "properties": {
                  "method": {
                    "type": "string",
                    "default": "v1",
                    "description": "API method v1"
                  },
                  "id": {
                    "type": "integer",
                    "default": 1,
                    "format": "int32",
                    "description": "Request ID"
                  },
                  "jsonrpc": {
                    "type": "string",
                    "default": "2.0",
                    "description": "JSON-RPC Version (2.0)"
                  },
                  "params": {
                    "title": "Parameters",
                    "type": "object",
                    "default": {
                      "@context": "https://www.w3.org/ns/activitystreams",
                      "type": "Note"
                    },
                    "required": [
                      "method",
                      "id",
                      "jsonrpc",
                      "id"
                    ],
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "id"
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
    "/api/v2": {
      "post": {
        "operationId": "v2.js",
        "deprecated": true,
        "summary": "/v2",
        "description": "Название API 2",
        "tags": [
          "JSONRPC"
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
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "method",
                  "id",
                  "jsonrpc"
                ],
                "properties": {
                  "method": {
                    "type": "string",
                    "default": "v2",
                    "description": "API method v2"
                  },
                  "id": {
                    "type": "integer",
                    "default": 1,
                    "format": "int32",
                    "description": "Request ID"
                  },
                  "jsonrpc": {
                    "type": "string",
                    "default": "2.0",
                    "description": "JSON-RPC Version (2.0)"
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
        "scheme": "digest"
      }
    },
    "schemas": {
      "Error": {
        "required": [
          "error",
          "id",
          "jsonrpc"
        ],
        "properties": {
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
