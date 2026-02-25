# OpenAPI JSON-RPC JSDoc Generator

**ALWAYS follow these instructions first. Only fall back to search or additional context gathering if the information here is incomplete or found to be in error.**

OpenAPI JSON-RPC JSDoc is a Node.js library that generates OpenAPI 3.1 specifications from JSDoc comments in JavaScript files containing JSON-RPC API methods. It parses JSDoc annotations and creates complete OpenAPI schemas with request/response structures for JSON-RPC 2.0 APIs.

## Working Effectively

### Quick Start & Dependencies
- **Node.js requirement**: Node.js >= 16 (confirmed working with v20.19.4)
- **Install dependencies**: `npm install` 
  - Takes approximately 30 seconds to complete
  - Will show 9 security vulnerabilities (known issue, doesn't affect functionality)
  - **NEVER CANCEL**: Set timeout to 60+ seconds for reliability

### Core Testing & Validation
- **Run unit tests**: `npm test -- --timeout=5s --match='t*'`
  - Takes approximately 1-2 seconds
  - Runs the two main unit tests (t1, t2) that validate OpenAPI generation
  - **Skip integration test**: The full `npm test` includes an HTTP integration test that times out after 10 seconds - this is a known issue and doesn't affect core functionality
  
- **Manual functionality validation** (ALWAYS run after changes):
```bash
# Create test file in repository root
cat > test-validation.js << 'EOF'
const openapiJSONRpcJSDoc = require('./index.js');
async function test() {
  const result = await openapiJSONRpcJSDoc({
    api: '/api/',
    servers: [{ url: 'http://localhost:8080' }],
    packageUrl: './package.json',
    files: './test/api/*.js',
  });
  console.log('✅ Generated paths:', Object.keys(result.paths));
  console.log('✅ API:', result.info.title, 'v' + result.info.version);
}
test().catch(console.error);
EOF

# Run validation test
node test-validation.js
```
- **Expected output**: Should show generated paths `[ '/api/v1', '/api/v2' ]` and `✅ API: openapi-jsonrpc-jsdoc v1.1.2`
- **Takes**: Less than 1 second (typically 0.3 seconds)
- **CRITICAL**: Always run this validation after making changes to `index.js`

## Validation Scenarios

### Core Functionality Testing
After making any changes to the library code (`index.js`), **ALWAYS** run these validation scenarios:

1. **JSDoc Parsing Test**:
   - The library should parse JSDoc comments from `test/api/v1.js` and `test/api/v2.js`
   - Generated OpenAPI spec should include both `/api/v1` and `/api/v2` endpoints
   - v1 endpoint should include parameter definitions from JSDoc @param tags
   - v2 endpoint should be marked as deprecated

2. **OpenAPI Schema Validation**:
   - Generated JSON should be valid OpenAPI 3.0 format
   - Each endpoint should have POST method with JSON-RPC request body schema
   - Request schema should include required fields: `method`, `id`, `jsonrpc`, and `params` (when applicable)

3. **Parameter Processing Test**:
   - Changes to parameter parsing logic require testing with complex JSDoc structures
   - Test with nested object parameters and various type annotations

## Repository Structure

### Key Files and Directories
```
/
├── index.js              # Main library file (174 lines) - core OpenAPI generation logic
├── package.json          # NPM package configuration - dependencies and scripts
├── test/
│   ├── index.test.js     # AVA test suite - unit and integration tests
│   └── api/              # Sample API files for testing
│       ├── v1.js         # Example API with parameters and JSDoc
│       └── v2.js         # Example deprecated API
├── .github/
│   └── workflows/        # CI/CD configuration
│       ├── nodejs.yml    # Main CI pipeline
│       └── npmpublish.yml # NPM publishing workflow
└── README.md             # Usage documentation and examples
```

### Important Code Sections
- **JSDoc parsing**: Lines 4-15 in `index.js` - uses jsdoc-x library
- **Parameter processing**: Lines 126-168 in `index.js` - converts JSDoc @param to OpenAPI schema
- **Schema generation**: Lines 64-125 in `index.js` - creates OpenAPI endpoint definitions

## Build and CI Information

### No Build Process Required
- This is a library package - no compilation or build step needed
- Main entry point is `index.js` which exports a single async function
- **Do not** look for build scripts like `npm run build` - they don't exist

### CI/CD Pipeline (.github/workflows/nodejs.yml)
- Runs on every push
- Uses Node.js 14.x (outdated but functional)
- Steps: `npm i` → `npm test`
- **Known issue**: CI may fail due to test timeout, but core functionality remains valid

### Dependencies
- **Production**: `jsdoc-x ~4.1.0` (JSDoc parsing)
- **Development**: `ava ~3.x` (testing), `express ~5.x`
- **Security warnings**: 9 known vulnerabilities in dev dependencies - does not affect production usage

## Common Development Tasks

### Adding New JSDoc Tags Support
1. Modify parameter parsing logic in `index.js` lines 126-168
2. Add test case in `test/api/` directory with new JSDoc pattern
3. Update unit tests in `test/index.test.js`
4. **ALWAYS validate** with manual functionality test

### Debugging Generation Issues
1. **Check JSDoc syntax**: Ensure proper `@param` and `@description` tags in API files
2. **Verify file patterns**: The `files` parameter must match existing .js files
3. **Test with minimal example**:
```javascript
// Create simple test API file
/**
 * @description Test API
 * @param {object} params - parameters
 * @param {string} params.id - user id
 */
module.exports = (params) => params.id;
```

### Testing Changes
- **Unit tests**: Run `npm test -- --match='t*' --timeout=5s` (avoids integration test timeout)
- **Manual validation**: Always run the functionality validation script above
- **Integration testing**: The HTTP integration test times out - this is expected and doesn't indicate problems

## Known Issues and Workarounds

### Test Suite Timeout
- **Issue**: Full `npm test` times out on HTTP integration test after 10 seconds
- **Workaround**: Run unit tests only with `npm test -- --match='t*' --timeout=5s`
- **Impact**: Core functionality is unaffected, unit tests validate library correctness

### Security Vulnerabilities
- **Issue**: 9 vulnerabilities in development dependencies (ava, jsdoc toolchain)
- **Status**: Known issue, doesn't affect production library usage
- **Action**: Do not run `npm audit fix --force` as it introduces breaking changes

### Node.js Version Compatibility
- **Requirement**: Node.js >= 16 (package.json engines field)
- **CI uses**: Node.js 14.x (should be updated to 16+ but currently functional)
- **Testing confirmed**: Works with Node.js 20.19.4

## Quick Reference Commands

```bash
# Fresh setup
npm install                                    # ~7-30 seconds

# Validate functionality  
npm test -- --match='t*' --timeout=5s        # ~1-2 seconds, unit tests only

# Manual library test (create test-validation.js first, see above)
node test-validation.js                       # <1 second

# Check package info
npm list --depth=0                           # Show direct dependencies
node --version                               # Verify Node.js version >= 16
```

## Timing Expectations
- **npm install**: 7-30 seconds (varies by network/cache, NEVER CANCEL - set 60+ second timeout)
- **Unit tests**: 1-2 seconds  
- **Manual validation**: <1 second (typically 0.3 seconds)
- **Full test suite**: 11+ seconds (times out, use unit tests instead)

**REMEMBER**: This library has no build process. Focus on testing JSDoc parsing and OpenAPI generation accuracy.