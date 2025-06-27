module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    globals: {
        Phaser: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
    },
    rules: {
        // Relaxed rules for game development
        'no-unused-vars': 'warn', // Warn instead of error for unused variables
        'no-param-reassign': 'off', // Common in game development
        'class-methods-use-this': 'off', // Phaser classes often don't use 'this'
        'no-plusplus': 'off',
        'no-console': 'off',
        'func-names': 'off',

        // Import rules
        'import/extensions': ['error', 'always'], // Require .js extensions
        'import/no-unresolved': 'off', // Turn off for now (can be complex to configure)
        'import/prefer-default-export': 'off', // Allow named exports without requiring default

        // Game-specific allowances
        'no-magic-numbers': 'off', // Games have lots of magic numbers (coordinates, etc.)
        'max-len': ['warn', { code: 120 }], // Longer lines allowed for game code

        // Team collaboration rules
        'consistent-return': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        eqeqeq: 'error', // Require === instead of ==
        curly: 'error', // Require braces for all control statements
    },
};