const uint8toString = (input: number[]): string => {
	let dataString = '';
	for (const v of input) {
		dataString += String.fromCharCode(v);
	}
	return dataString;
};

export { uint8toString };
