import React from 'react';
import { BoolEditor } from './BoolEditor';
import { ListEditor } from './ListEditor';
import { MapEditor } from './MapEditor';
import { OptionEditor } from './OptionEditor';
import { PairEditor } from './PairEditor';
import { PrimitiveEditor } from './PrimitiveEditor';

export const DataEditorNode = (
	{ dataType, onChange, value }: { dataType: any; value: any; onChange: (value: any) => void },
) => (
	<div>
		{(dataType.annots as string[])?.map(x => x.substring(1)).join(' ')}
		{getEditor({ dataType, onChange, value })}
	</div>
);

const getEditor = (
	{ dataType, onChange, value }: { dataType: any; value: any; onChange: (value: any) => void },
) => {
	const prim = dataType.prim;
	switch (prim) {
		case 'unit':
			if (!value || typeof value !== 'object' || value.prim !== 'Unit') {
				onChange({
					'prim': 'Unit',
				});
			}
			return null;
		case 'string':
		case 'nat':
		case 'int':
		case 'bytes':
		case 'timestamp':
		// TODO: investigate each Domain-Specific type and make sure it's working fine
		case 'mutez':
		case 'address':
		case 'key':
		case 'key_hash':
		case 'signature':
		case 'chain_id':
		case 'bls12_381_g1':
		case 'bls12_381_g2':
		case 'bls12_381_fr':
		case 'sapling_transaction ms':
		case 'sapling_state ms':
		case 'ticket':
		case 'chest':
		case 'chest_key':
		case 'tx_rollup_l2_address':
			return <PrimitiveEditor dataType={prim} value={value} onChange={onChange} />;
		case 'bool':
			return <BoolEditor value={value} onChange={onChange} />;
		case 'list':
		case 'set':
			return <ListEditor dataType={dataType} value={value as any[]} onChange={onChange} />;
		case 'option':
			return <OptionEditor dataType={dataType} value={value} onChange={onChange} />;
		case 'pair':
			return <PairEditor value={value} dataType={dataType} onChange={onChange} />;
		case 'map':
		case 'big_map':
			return <MapEditor value={value} dataType={dataType} onChange={onChange} />;
		default:
			return (
				<span>
					The editor for {dataType.prim}{' '}
					is not implemented yet, please contract the taqueria team at github.com/ecadlabs/taqueria to report this
					issue.
				</span>
			);
	}
};
