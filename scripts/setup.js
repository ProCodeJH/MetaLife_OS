import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const PROJECT_ROOT = __dirname;
const APPS_DIR = path.join(PROJECT_ROOT, 'apps');
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents');
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');

console.log('🚀 Setting up MetaLife OS...\n');

// Create directories
const directories = [
  'apps/web',
  'apps/api',
  'apps/content-automation',
  'apps/web-studio',
  'apps/media-generation',
  'agents/agent-local',
  'agents/agent-glm',
  'agents/shared',
  'services/auth',
  'services/storage',
  'services/notification',
  'packages/ui',
  'packages/config',
  'packages/database',
  'packages/types',
  'packages/utils',
  'templates/websites',
  'templates/blogs',
  'templates/social-media',
  'templates/presentations',
  'docs/architecture',
  'docs/api',
  'docs/guides',
  'tests/e2e',
  'tests/integration',
  'infrastructure/docker',
  'infrastructure/kubernetes',
  'infrastructure/terraform',
  'infrastructure/monitoring',
  'scripts/setup',
  'scripts/build',
  'scripts/deploy',
  'scripts/maintenance'
];

directories.forEach(dir => {
  const fullPath = path.join(PROJECT_ROOT, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Copy environment file
if (!existsSync(path.join(PROJECT_ROOT, '.env'))) {
  console.log('📝 Creating .env file from template...');
  execSync('cp .env.example .env', { stdio: 'inherit' });
}

// Install dependencies
console.log('\n📦 Installing root dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Setup Python virtual environments
const pythonApps = [
  'apps/api',
  'apps/content-automation',
  'agents/agent-local',
  'agents/agent-glm'
];

pythonApps.forEach(app => {
  const appPath = path.join(PROJECT_ROOT, app);
  if (existsSync(appPath)) {
    console.log(`\n🐍 Setting up Python environment for ${app}...`);
    try {
      execSync('python -m venv venv', { cwd: appPath, stdio: 'inherit' });
      const venvPython = path.join(appPath, 'venv', 'bin', 'python');
      if (existsSync(venvPython)) {
        execSync(`${venvPython} -m pip install --upgrade pip`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.log(`⚠️  Failed to create venv for ${app}: ${error.message}`);
    }
  }
});

// Initialize Git hooks
console.log('\n🔧 Setting up Git hooks...');
try {
  execSync('npx husky install', { stdio: 'inherit' });
  console.log('✅ Git hooks installed');
} catch (error) {
  console.log('⚠️  Failed to install Git hooks');
}

// Create TypeScript configuration
const tsconfig = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['dom', 'dom.iterable', 'ES2022'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    forceConsistentCasingInFileNames: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve',
    incremental: true,
    plugins: [{ name: 'next' }],
    baseUrl: '.',
    paths: {
      '@/*': ['./*'],
      '@/apps/*': ['./apps/*'],
      '@/packages/*': ['./packages/*'],
      '@/agents/*': ['./agents/*'],
      '@/services/*': ['./services/*'],
      '@/templates/*': ['./templates/*']
    }
  },
  include: [
    'next-env.d.ts',
    '**/*.ts',
    '**/*.tsx',
    '.next/types/**/*.ts'
  ],
  exclude: ['node_modules', 'venv', '__pycache__', '.next']
};

// Write TypeScript config
require('fs').writeFileSync(
  path.join(PROJECT_ROOT, 'tsconfig.json'),
  JSON.stringify(tsconfig, null, 2)
);
console.log('✅ TypeScript configuration created');

// Create Turbo configuration
const turbo = {
  $schema: 'https://turbo.build/schema.json',
  globalDependencies: ['**/.env.*local'],
  pipeline: {
    build: {
      dependsOn: ['^build'],
      outputs: ['dist/**', '.next/**', '!.next/cache/**']
    },
    lint: {
      outputs: []
    },
    dev: {
      cache: false,
      persistent: true
    },
    clean: {
      cache: false
    },
    typecheck: {
      dependsOn: ['^typecheck'],
      outputs: []
    },
    test: {
      dependsOn: ['^build'],
      outputs: ['coverage/**']
    }
  }
};

require('fs').writeFileSync(
  path.join(PROJECT_ROOT, 'turbo.json'),
  JSON.stringify(turbo, null, 2)
);
console.log('✅ Turbo configuration created');

// Create Prettier configuration
const prettier = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf'
};

require('fs').writeFileSync(
  path.join(PROJECT_ROOT, '.prettierrc'),
  JSON.stringify(prettier, null, 2)
);
console.log('✅ Prettier configuration created');

// Create ESLint configuration
const eslint = {
  extends: [
    'next/core-web-vitals',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  ignorePatterns: ['node_modules/', 'venv/', '__pycache__/', '.next/']
};

require('fs').writeFileSync(
  path.join(PROJECT_ROOT, '.eslintrc.json'),
  JSON.stringify(eslint, null, 2)
);
console.log('✅ ESLint configuration created');

console.log('\n🎉 MetaLife OS setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Copy .env.example to .env and configure your API keys');
console.log('2. Run "npm run docker:dev" to start the development environment');
console.log('3. Visit http://localhost:3000 for the web application');
console.log('4. Visit http://localhost:8000 for the API documentation');
console.log('5. Check http://localhost:3001 for Grafana monitoring');
console.log('\n📚 For more information, see the documentation in the docs/ directory.');