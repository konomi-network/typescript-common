import { uint8toString } from './uint8array';

describe('uint8toString', () => {
	it('return empty string with empty input array', () => {
		const result = uint8toString([]);
		expect(result).toBe('');
	});
	it('return correct string with one number', () => {
		const result = uint8toString([100]);
		expect(result).toBe('d');
	});
});
