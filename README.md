# openapi-jsonrpc-jsdoc

Install
```fish
npm i openapi-jsonrpc-jsdoc --save-dev
```

## Example
### Create JSON-RPC Methoc
```js
// api/api-v1.js
/**
  * @description Название API
  * @param {object} parameters - params
  * @param {string} parameters.id - id
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
const data = await openapiJSONRpcJSDoc({
    api: '/',
    servers: [
        {
            url: '0.0.0.0:8080',
         },
    ],
    packageUrl: './package.json',
    files: './api/*.js',
});
fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
```

### Result
```json
// openapi.json
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
    "version": "1.0.0",
    "title": "project-name",
    "description": "project-description"
  },
  "servers": [
    {
      "url": "0.0.0.0:8080"
    }
  ],
  "paths": {
    "/api/api-v1": {
      "post": {
        "operationId": "api-v1.js",
        "deprecated": false,
        "summary": "/api-v1",
        "description": "Название API",
        "tags": [
          "JSONRPC"
        ],
        "parameters": [],
        "responses": {
          "200": {
            "description": "OK"
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
                    "default": "api-v1",
                    "description": "API method api-v1"
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
                    "required": [
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
    }
  },
  "components": {
    "securitySchemes": {
      "BasicAuth": {
        "type": "http",
        "scheme": "digest"
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