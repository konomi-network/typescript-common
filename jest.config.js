module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	verbose: true,
	collectCoverage: true,
	coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/dist/', '<rootDir>/node_modules/'],
	coverageDirectory: '<rootDir>/coverage/',
	roots: ['<rootDir>/src/'],
};
