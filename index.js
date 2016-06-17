
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
	[ 'money', 'numeric' ],
	[ 'geopoint', 'double precision array' ],
]);


function generateYaml (keystone) {
	var chunks = [
		'---\n',
		keystone.get('db name') + ':',
	];

	Object.keys(keystone.lists).forEach(listKey => {
		var list = keystone.lists[listKey];

		chunks = chunks.concat(['',
			'  ' + list.path.toLowerCase() + ':',
			'    :meta:',
			'      :table: ' + list.path.toLowerCase(),
			'      :extra_props: false',
			'    :columns:',
			'    - id:',
			'      :source: _id',
			'      :type: text',
		]);

		var ymlFields = Object.keys(list.fields).map(fieldKey => {
			var field = list.fields[fieldKey];
			var column = field.path.toLowerCase().replace(/[^a-zA-Z0-9\-_ \.]/g, '').replace(/[^a-zA-Z0-9_]/g, '_');

			// Skip password fields
			if (field.type === 'password') {
				return '    # password field excluded';
			}

			// Flatten name out
			if (field.type === 'name') {
				return [
					'    - ' + column + '_first: ',
					'      :source: ' + field.path + '.first',
					'      :type: text',
					'    - ' + column + '_last: ',
					'      :source: ' + field.path + '.last',
					'      :type: text',
				].join('\n');
			}

			// Flatten addresses/locations out
			if (field.type === 'location') {
				return [
					'    - ' + column + '_street1:',
					'      :source: ' + field.path + '.street1',
					'      :type: text',
					'    - ' + column + '_street2:',
					'      :source: ' + field.path + '.street2',
					'      :type: text',
					'    - ' + column + '_building_name:',
					'      :source: ' + field.path + '.name',
					'      :type: text',
					'    - ' + column + '_shop:',
					'      :source: ' + field.path + '.shop',
					'      :type: text',
					'    - ' + column + '_number:',
					'      :source: ' + field.path + '.number',
					'      :type: text',
					'    - ' + column + '_state:',
					'      :source: ' + field.path + '.state',
					'      :type: text',
					'    - ' + column + '_postcode:',
					'      :source: ' + field.path + '.postcode',
					'      :type: text',
					'    - ' + column + '_suburb:',
					'      :source: ' + field.path + '.suburb',
					'      :type: text',
					'    - ' + column + '_geo:',
					'      :source: ' + field.path + '.geo',
					'      :type: double precision array',
				].join('\n');
			}

			// Flatten files that have been uploaded to s3file
			if (field.type === 's3file') {
				return [
					'    - ' + column + '_filename:',
					'      :source: ' + field.path + '.filename',
					'      :type: text',
					'    - ' + column + '_originalname:',
					'      :source: ' + field.path + '.originalname',
					'      :type: text',
					'    - ' + column + '_path:',
					'      :source: ' + field.path + '.path',
					'      :type: text',
					'    - ' + column + '_size:',
					'      :source: ' + field.path + '.size',
					'      :type: int',
					'    - ' + column + '_filetype:',
					'      :source: ' + field.path + '.filetype',
					'      :type: text',
					'    - ' + column + '_url:',
					'      :source: ' + field.path + '.url',
					'      :type: text',
				].join('\n');
			}

			// Type not recognised
			if (!typeMap.has(field.type)) {
				return '    # field type not recognised: ' + field.type;
			}

			var type = typeMap.get(field.type);
			return [
				'    - ' + column + ':',
				'      :source: ' + field.path,
				'      :type: ' + type,
			].join('\n');
		});

		chunks = chunks.concat(ymlFields);
	});

	return chunks.join('\n');
};


module.exports = generateYaml;