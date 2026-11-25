import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  },
  {
    files: ['src/servicios/**/*.js', 'src/rutas/**/*.js', 'src/middleware/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['mysql2', 'mysql2/promise', 'knex'],
          patterns: [
            {
              group: ['**/db/conexion.js'],
              importNames: ['conexion', 'consulta'],
              message: 'Accede a los datos mediante un repositorio.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/repositorios/**/*.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(raw|whereRaw|selectRaw|orderByRaw|joinRaw)$/]",
          message: 'Usa el constructor de consultas; el SQL directo se reserva a migraciones.'
        }
      ]
    }
  }
];
