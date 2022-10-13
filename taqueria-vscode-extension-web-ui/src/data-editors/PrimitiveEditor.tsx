import React from 'react';

export const PrimitiveEditor = (
	{ dataType, value, onChange }: {
		dataType: string;
		value: Record<string, any>;
		onChange: (value: Record<string, any>) => void;
	},
) => {
	const fieldName = getFieldName();
	const changeValue = (v: string) => {
		const newValue: Record<string, any> = {};
		newValue[fieldName] = v;
		onChange(newValue);
	};
	if (value === null || value === undefined || typeof value !== 'object') {
		changeValue('');
		value = {
			[fieldName]: '',
		};
	}
	return <input type='text' value={value[fieldName]} onChange={e => changeValue(e.target.value)} />;

	function getFieldName() {
		switch (dataType) {
			case 'int':
			case 'nat':
				return 'int';
			case 'bytes':
				return 'bytes';
			default:
				return 'string';
		}
	}
};
