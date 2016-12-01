MoSQL Yaml Generator for Keystone
=================================

Tools for generating a MoSQL-compatible YAML document describing the lists and models configured for your Keystone instance.


## Usage

Require the package like always:

```javascript
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');
```

### Drop in Endpoint

The simplest way to use is to drop the included endpoint in your routes, like this:

```javascript
app.get('/api/keystoneListsYaml', mosqlYaml.createMosqlYamlEndpoint(keystone));
```

Or, if there isn't already middleware restricting access, maybe closer to this:

```javascript
app.get('/api/keystoneListsYaml', bsMiddleware.restrictWithUserFlag('isAdmin'), mosqlYaml.createMosqlYamlEndpoint(keystone));
```
Here we've use the [blueshyft middleware package](https://www.npmjs.com/package/@thinkmill/blueshyft-middleware) to restrict access to admins.


### DIY Endpoint

If you wanted to create your own endpoint, here's a reasonable starting point:

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
