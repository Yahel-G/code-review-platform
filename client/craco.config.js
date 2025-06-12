module.exports = {
  jest: {
    configure: (jestConfig, { env, paths, resolve, rootDir }) => {
      return {
        ...jestConfig,
        transform: {
          ...jestConfig.transform,
          '^.+\.(ts|tsx)$': 'babel-jest',
        },
        transformIgnorePatterns: [
          "node_modules/(?!(axios|react-router-dom)/)"
        ],
        setupFilesAfterEnv: ['<rootDir>/src/setupTests.tsx'],
        moduleNameMapper: {
          ...jestConfig.moduleNameMapper,
          "^@/(.*)$": "<rootDir>/src/$1",
          "\\.(css|less|scss|sass)$": "identity-obj-proxy"
        }
      };
    }
  }
};
