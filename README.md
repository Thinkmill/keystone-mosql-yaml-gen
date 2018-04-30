MoSQL Yaml Generator for Keystone
================================================================================

Tools for generating a MoSQL-compatible YAML document describing the lists and models configured for your Keystone instance.


Usage
--------------------------------------------------------------------------------

### Basic Usage

```javascript
const keystone = require('keystone');
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');

// Create a generator instance
const yamlGenerator = new mosqlYaml.YamlGenerator(keystone);

// Extract the MoSQL yaml for your lists
const listYaml = yamlGen.generateYaml();
```

### Express Endpoint

The simplest way to use is to drop the included endpoint in your Express routes, like this:

```javascript
app.get('/api/keystoneListsYaml', mosqlYaml.createMosqlYamlEndpoint(keystone));
```

Alternatively, if you wanted to create your own endpoint it might look more like this:

```javascript
const keystone = require('keystone');
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');

module.exports = function (req, res, next) {
	const yamlGen = new mosqlYaml.YamlGenerator(keystone);

	res.set('content-disposition', `attachment; filename="${yamlGen.getFilename()}"`);
	res.set('content-Type', 'application/x-yaml');
	res.send(yamlGen.generateYaml());
};
```


Notes
--------------------------------------------------------------------------------

### Strings

Unlike other database systems, in PostgreSQL, there is no performance difference between `varchar`, `varchar(n)` and `text` types.

### Numbers

Numbers in JavaScript are 64-bit floating points; equivilant to PGs `double precision` type.
Note that for `Money` fields we import the existing representation as a `double precision`.
These values should be converted to a lossless type before being manipulated (eg. `numeric(20, 4)`).

### Dates

JavaScript `Date` objects have not timezone information; they're Epoch-base and are effectively in UTC.
Importing as `timestamp with time zone` will also default to UTC while maintaining the correct value.

`Date` objects also maintain only millisecond precision (ie. 1/1,000 of a second).
PostgreSQL on the other hand, defaults to microsecond precision for it's `timestamp` types (ie. 1/1,000,000 of a second).
This tool sticks with the Postgres default but column types could later be altered to `timestamp (3) with time zone` without any data loss.

### Simple Type Mappings

Values are mapped to individual columns where possible:

| Keystone Type | PostgreSQL Type | Notes |
|---------------|-----------------|-------|
| `datetime` | `timestamp with time zone` | See [Dates](#dates) above |
| `date` | `timestamp with time zone` |  |
| `number` | `double precision` |  |
| `relationship` | `text` | When `many !== true` |
| `relationship` | `text array` | When `many === true` |
| `select` | `text` |  |
| `text` | `text` |  |
| `boolean` | `boolean` |  |
| `code` | `text` |  |
| `email` | `text` |  |
| `html` | `text` |  |
| `markdown` | `text` |  |
| `textarea` | `text` |  |
| `money` | `double precision` | See [Numbers](#numbers) above |
| `geopoint` | `double precision array` |  |
| `textarray` | `text array` |  |

### Complex Type Mappings

Some of the more complete, mulit-value types are mapped to muliple columns:

#### `name` Type

| Keystone Field | Column Name | PostgreSQL Type |
|----------------|-------------|-----------------|
| `(key).first` | `(key)_first` | `text` |
| `(key).last` | `(key)_last` | `text` |

#### `location` Type

| Keystone Field | Column Name | PostgreSQL Type |
|----------------|-------------|-----------------|
| `(key).street1` | `(key)_street1` | `text` |
| `(key).street2` | `(key)_street2` | `text` |
| `(key).name` | `(key)_building_name` | `text` |
| `(key).shop` | `(key)_shop` | `text` |
| `(key).number` | `(key)_number` | `text` |
| `(key).state` | `(key)_state` | `text` |
| `(key).postcode` | `(key)_postcode` | `text` |
| `(key).suburb` | `(key)_suburb` | `text` |
| `(key).geo` | `(key)_geo` | `double` |

#### `s3file` Type

| Keystone Field | Column Name | PostgreSQL Type |
|----------------|-------------|-----------------|
| `(key).filename` | `(key)_filename` | `text` |
| `(key).originalname` | `(key)_originalname` | `text` |
| `(key).path` | `(key)_path` | `text` |
| `(key).size` | `(key)_size` | `int` |
| `(key).filetype` | `(key)_filetype` | `text` |
| `(key).url` | `(key)_url` | `text` |

#### `cloudinaryimage` Type

| Keystone Field | Column Name | PostgreSQL Type |
|----------------|-------------|-----------------|
| `(key).public_id` | `(key)_public_id` | `text` |
| `(key).version` | `(key)_version` | `int` |
| `(key).signature` | `(key)_signature` | `text` |
| `(key).width` | `(key)_width` | `int` |
| `(key).height` | `(key)_height` | `int` |
| `(key).format` | `(key)_format` | `text` |
| `(key).resource_type` | `(key)_resource_type` | `text` |
| `(key).url` | `(key)_url` | `text` |
| `(key).secure_url` | `(key)_secure_url` | `text` |


--------------------------------------------------------------------------------

Developed by [Thinkmill](http://www.thinkmill.com.au) for [Keystone.js](http://keystonejs.com).
