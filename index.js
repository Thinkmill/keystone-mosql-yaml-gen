
const typeMap = new Map([
	[ 'datetime', 'timestamp' ],
	[ 'number', 'numeric' ],
	[ 'relationship', 'text' ],
	[ 'select', 'text' ],
	[ 'text', 'text' ],
	[ 'boolean', 'boolean' ],
	[ 'code', 'text' ],
	[ 'email', 'text' ],
	[ 'html', 'text' ],
	[ 'markdown', 'text' ],
	[ 'textarea', 'text' ],
	[ 'money', 'numeric' ],	// 'numeric(20, 4)' would be better?
	[ 'geopoint', 'double precision array' ],
	[ 'textarray', 'text array' ],
]);


function columnYaml (column, source, type) {
	return '    - ' + column + ':\n      :source: ' + source + '\n      :type: ' + type;
}

function generateYaml (keystone) {
	var chunks = [
		'---\n',
		keystone.get('db name') + ':',
	];

	Object.keys(keystone.lists).forEach(listKey => {
		var list = keystone.lists[listKey];
		var collection = keystone.prefixModel(listKey);
		
		chunks = chunks.concat(['',
			'  ' + collection + ':',
			'    :meta:',
			'      :table: ' + collection,
			'      :extra_props: false',
			'    :columns:',
			columnYaml('id', '_id', 'text'),
		]);

		var ymlFields = Object.keys(list.fields).map(fieldKey => {
			var field = list.fields[fieldKey];
			var column = field.path.toLowerCase().replace(/[^a-zA-Z0-9\-_ \.]/g, '').replace(/[^a-zA-Z0-9_]/g, '_');
			
			// If field type is 'relationship' but it's for multiple, override the pgsql type
			if (field.type === 'relationship' && field.many) {
				return columnYaml(column, field.path, 'text array');
			}
			
			// Skip password fields
			if (field.type === 'password') {
				return '    # password field excluded';
			}

			// Flatten name out
			if (field.type === 'name') {
				return [
					columnYaml(column + '_first', field.path + '.first', 'text'),
					columnYaml(column + '_last', field.path + '.last', 'text'),
				].join('\n');
			}

			// Flatten addresses/locations out
			if (field.type === 'location') {
				return [
					columnYaml(column + '_street1', field.path + '.street1', 'text'),
					columnYaml(column + '_street2', field.path + '.street2', 'text'),
					columnYaml(column + '_building_name', field.path + '.name', 'text'),
					columnYaml(column + '_shop', field.path + '.shop', 'text'),
					columnYaml(column + '_number', field.path + '.number', 'text'),
					columnYaml(column + '_state', field.path + '.state', 'text'),
					columnYaml(column + '_postcode', field.path + '.postcode', 'text'),
					columnYaml(column + '_suburb', field.path + '.suburb', 'text'),
					columnYaml(column + '_geo', field.path + '.geo', 'double precision array'),
				].join('\n');
			}

			// Flatten files that have been uploaded to s3file
			if (field.type === 's3file') {
				return [
					columnYaml(column + '_filename', field.path + '.filename', 'text'),
					columnYaml(column + '_originalname', field.path + '.originalname', 'text'),
					columnYaml(column + '_path', field.path + '.path', 'text'),
					columnYaml(column + '_size', field.path + '.size', 'int'),
					columnYaml(column + '_filetype', field.path + '.filetype', 'text'),
					columnYaml(column + '_url', field.path + '.url', 'text'),
				].join('\n');
			}

			// Type not recognised
			if (!typeMap.has(field.type)) {
				return '    # field type not recognised: ' + field.type;
			}

			var type = typeMap.get(field.type);
			return columnYaml(column, field.path, type);
		});

		chunks = chunks.concat(ymlFields);
	});

	return chunks.join('\n');
};


module.exports = generateYaml;