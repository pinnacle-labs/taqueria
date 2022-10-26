export const transferOutput = (contract: string): string => {
	const output =
		`┌────────────────┬────────────────────────────────────────┬──────────────┬───────────┬────────────┬────────────────────────┐
│ Contract Alias │ Contract Address                     │ Mutez Transfer │ Parameter │ Entrypoint │ Destination            │
├────────────────┼──────────────────────────────────────┼────────────────┼───────────┼────────────┼────────────────────────┤
│ N/A            │ ${contract} │ 0            │ 1         │ default      │ http://localhost:20040 │
│                │                                      │                │           │            │                        │
└────────────────┴──────────────────────────────────────┴────────────────┴───────────┴────────────┴────────────────────────┘
`;
	return output;
};
