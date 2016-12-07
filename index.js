'use strict';

const mongodbUri = require('mongodb-uri');

const typeMap = new Map([
	['datetime', 'timestamp'],
	['number', 'numeric'],
	['relationship', 'text'],
	['select', 'text'],
	['text', 'text'],
	['boolean', 'boolean'],
	['code', 'text'],
	['email', 'text'],
	['html', 'text'],
	['markdown', 'text'],
	['textarea', 'text'],
	['money', 'numeric'],	// 'numeric(20, 4)' would be better?
	['geopoint', 'double precision array'],
	['textarray', 'text array'],
]);


class YamlGenerator {

	// We store a ref to the keystone obj
	constructor (keystone) {
		this.keystone = keystone;
	}

	// Extract the name of the DB from keystones mongo uri
	// Keystone does the job of defaulting the 'mongo' value if it isn't directly supplied
	getDbName () {
		const uriStr = this.keystone.get('mongo');
		const uriObj = mongodbUri.parse(uriStr);
		return uriObj.database;
	}

	// A helper function for generating a nice, timestamped filename for the yaml
	getFilename () {
		const dateStamp = new Date(). toISOString().split('T')[0].replace(/\-/g, '');
		return `${dateStamp}-${this.getDbName()}-MoSQL.yaml`;
	}

	// Internal helper; builds a yaml snippit for a single field
	columnYaml (column, source, type) {
		return '    - ' + column + ':\n      :source: ' + source + '\n      :type: ' + type;
	}

	// Produce a complete yaml document for the lists configured in the keystone instance supplied
	generateYaml () {
		var chunks = [`---`, `${this.getDbName()}:`];

		Object.keys(this.keystone.lists).forEach(listKey => {
			var list = this.keystone.lists[listKey];
			var collection = this.keystone.prefixModel(listKey);

			chunks = chunks.concat(['',
				'  ' + collection + ':',
				'    :meta:',
				'      :table: ' + collection,
				'      :extra_props: false',
				'    :columns:',
				this.columnYaml('id', '_id', 'text'),
			]);

			var ymlFields = Object.keys(list.fields).map(fieldKey => {
				var field = list.fields[fieldKey];
				var column = field.path.toLowerCase().replace(/[^a-zA-Z0-9\-_ \.]/g, '').replace(/[^a-zA-Z0-9_]/g, '_');

				// If field type is 'relationship' but it's for multiple, override the pgsql type
				if (field.type === 'relationship' && field.many) {
					return this.columnYaml(column, field.path, 'text array');
				}

				// Skip password fields
				if (field.type === 'password') {
					return '    # password field excluded';
				}

				// Flatten name out
				if (field.type === 'name') {
					return [
						this.columnYaml(column + '_first', field.path + '.first', 'text'),
						this.columnYaml(column + '_last', field.path + '.last', 'text'),
					].join('\n');
				}

				// Flatten addresses/locations out
				if (field.type === 'location') {
					return [
						this.columnYaml(column + '_street1', field.path + '.street1', 'text'),
						this.columnYaml(column + '_street2', field.path + '.street2', 'text'),
						this.columnYaml(column + '_building_name', field.path + '.name', 'text'),
						this.columnYaml(column + '_shop', field.path + '.shop', 'text'),
						this.columnYaml(column + '_number', field.path + '.number', 'text'),
						this.columnYaml(column + '_state', field.path + '.state', 'text'),
						this.columnYaml(column + '_postcode', field.path + '.postcode', 'text'),
						this.columnYaml(column + '_suburb', field.path + '.suburb', 'text'),
						this.columnYaml(column + '_geo', field.path + '.geo', 'double precision array'),
					].join('\n');
				}

				// Flatten files that have been uploaded to s3file
				if (field.type === 's3file') {
					return [
						this.columnYaml(column + '_filename', field.path + '.filename', 'text'),
						this.columnYaml(column + '_originalname', field.path + '.originalname', 'text'),
						this.columnYaml(column + '_path', field.path + '.path', 'text'),
						this.columnYaml(column + '_size', field.path + '.size', 'int'),
						this.columnYaml(column + '_filetype', field.path + '.filetype', 'text'),
						this.columnYaml(column + '_url', field.path + '.url', 'text'),
					].join('\n');
				}

				// Type not recognised
				if (!typeMap.has(field.type)) {
					return '    # field type not recognised: ' + field.type;
				}

				var type = typeMap.get(field.type);
				return this.columnYaml(column, field.path, type);
			});

			chunks = chunks.concat(ymlFields);
		});

		return chunks.join('\n');
	};
}


// Returns an endpoint function for building the Yaml and returning it to the caller
// Makes it super-easy to hook into an existing keystone install
// Intended usage:
//		api.get('/keystoneListsYaml', mosqlYaml.createMosqlYamlEndpoint(keystone));
function createMosqlYamlEndpoint (keystone) {
	return function (req, res, next) {
		const yamlGen = new YamlGenerator(keystone);

		res.set('content-disposition', `attachment; filename="${yamlGen.getFilename()}"`);
		res.set('content-Type', 'application/x-yaml');
		res.send(yamlGen.generateYaml());
	};
}


module.exports = { YamlGenerator, createMosqlYamlEndpoint };
