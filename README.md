MoSQL Yaml Generator for Keystone
=================================

Tools for generating a MoSQL-compatible YAML document describing the lists and models configured for your Keystone instance.


## Usage

The simplest way to use is to drop the included endpoint in your routes, like this:

```javascript
api.get('/keystoneListsYaml', mosqlYaml.createMosqlYamlEndpoint(keystone));
```

Or, if you wanted to create your own endpoint, here's a reasonable starting point:

```javascript
'use strict';

const keystone = require('keystone');
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');

module.exports = function (req, res, next) {
	const yamlGen = new mosqlYaml.YamlGenerator(keystone);

	res.set('content-disposition', `attachment; filename="${yamlGen.getFilename()}"`);
	res.set('content-Type', 'application/x-yaml');
	res.send(yamlGen.generateYaml());
};
```
