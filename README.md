MoSQL Yaml Generator for Keystone
================================================================================

Tools for generating a [MoSQL](https://github.com/stripe/mosql)-compatible YAML document describing the lists configured for your [Keystone 4](http://keystonejs.com) instance.
This can be useful for exporting data from a Keystone instance or streaming updates to a reporting database in near real-time.

You'll need to install [MoSQL](https://github.com/stripe/mosql) and [PostgreSQL](https://www.postgresql.org/download) separately.


Usage
--------------------------------------------------------------------------------

### Generating the Config

```javascript
const keystone = require('keystone');
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');

// Create a generator instance
const yamlGenerator = new mosqlYaml.YamlGenerator(keystone);

// Extract the MoSQL YAML for your lists
const collectionsYaml = yamlGenerator.generateYaml();
console.log(collectionsYaml);
```

#### Express Endpoint

A drop-in [ExpressJS](https://expressjs.com) endpoint is included.
This can be useful if your schema is often changing; a process could be configured to periodically download an up-to-date config.

Add the endpoint to your Express app like this:

```javascript
const keystone = require('keystone');
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');

app.get('/api/keystoneListsYaml', mosqlYaml.createMosqlYamlEndpoint(keystone));
```

Alternatively, create your own endpoint:

```javascript
const keystone = require('keystone');
const mosqlYaml = require('@thinkmill/keystone-mosql-yaml-gen');

const endpoint = function (req, res, next) {
	const yamlGenerator = new mosqlYaml.YamlGenerator(keystone);
	const collectionsYaml = yamlGenerator.generateYaml();

	res.set('content-disposition', `attachment; filename="${yamlGenerator.getFilename()}"`);
	res.set('content-Type', 'application/x-yaml');
	res.send(collectionsYaml);
};
```

### Consuming the Config

The config generated describes the collections and fields to copy.
It's supplied to `mosql` like this:

```sh
mosql -c 180502-keystone-MoSQL.yaml [--sql postgres://sql-server/sql-db] [--mongo mongodb://mongo-uri]
```

See the [MoSQL](https://github.com/stripe/mosql) docs for more options.


Types
--------------------------------------------------------------------------------

### Strings

Unlike other database systems, in PostgreSQL, there is no performance difference between `varchar`, `varchar(n)` and `text` types.
We preference `text`.

### Numbers

Numbers in JavaScript are 64-bit floating points; equivalent to PGs `double precision` type.

Note that for `Money` fields are also imported as `double precision`.
These values should be converted to a lossless type before being manipulated (eg. `numeric(20, 4)` or similar).

### Dates

JavaScript `Date` objects have no timezone information -- they're epoch-base and effectively in UTC.
Importing as `timestamp with time zone` will maintaining the correct value while defaulting the time zone stored to UTC.

`Date` objects also maintain only millisecond precision (ie. 1/1,000 of a second).
PostgreSQL on the other hand, defaults to microsecond precision for it's `timestamp` types (ie. 1/1,000,000 of a second).
This tool sticks with the Postgres default but column types could later be altered to `timestamp (3) with time zone` without any data loss.

### Passwords

Currently passwords are intentionally excluded from the dumped fields.

(TODO: Add configuration options for this)

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

Some of the more complex, multi-value types are mapped to multiple columns:

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
| `(key).geo` | `(key)_geo` | `double precision array` |

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


Naming
--------------------------------------------------------------------------------

Column names are forced to lowercase and restricted to the character set `[a-zA-Z0-9_]`.
Any whitespace, hyphens or stops are replaced with underscores.

(TODO: Add configuration options for this)


--------------------------------------------------------------------------------

Developed by [John Molomby](https://github.com/molomby) at [Thinkmill](http://www.thinkmill.com.au) for [Keystone.js](http://keystonejs.com).
