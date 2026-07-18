import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, truncateDiff } from '../prompts/conventionalCommit';
import { createProvider, isValidProvider } from '../services/providerFactory';
import {
  AIProviderError,
  AIProviderType,
  PROVIDER_INFO,
  PROVIDER_MODEL_SETTING_KEYS,
} from '../types';

type SettingDefinition = {
  default?: unknown;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  scope?: string;
};

type ExtensionManifest = {
  contributes: {
    configuration: {
      properties: Record<string, SettingDefinition>;
    };
  };
};

const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
) as ExtensionManifest;

suite('Provider configuration', () => {
  const providerTypes = Object.keys(PROVIDER_INFO) as AIProviderType[];

  test('recognizes every supported provider', () => {
    for (const providerType of providerTypes) {
      assert.strictEqual(isValidProvider(providerType), true);
    }
    assert.strictEqual(isValidProvider('unsupported'), false);
  });

  test('creates providers with recommended models by default', () => {
    for (const providerType of providerTypes) {
      const provider = createProvider(providerType, 'test-api-key');
      assert.strictEqual(provider.model, PROVIDER_INFO[providerType].model);
      assert.strictEqual(provider.name, PROVIDER_INFO[providerType].label);
    }
  });

  test('passes custom model overrides to every provider', () => {
    for (const providerType of providerTypes) {
      const customModel = `custom/${providerType}`;
      const provider = createProvider(providerType, 'test-api-key', customModel);
      assert.strictEqual(provider.model, customModel);
    }
  });

  test('rejects missing API keys', () => {
    assert.throws(
      () => createProvider('gemini', ''),
      (error: unknown) => error instanceof AIProviderError && error.code === 'NO_API_KEY'
    );
  });

  test('keeps recommended models aligned with Settings defaults', () => {
    const settings = manifest.contributes.configuration.properties;

    for (const providerType of providerTypes) {
      const settingName = `cleancommit.${PROVIDER_MODEL_SETTING_KEYS[providerType]}`;
      assert.strictEqual(settings[settingName]?.default, PROVIDER_INFO[providerType].model);
    }
  });
});

suite('Prompt generation', () => {
  test('keeps small diffs unchanged', () => {
    const diff = 'diff --git a/file.ts b/file.ts\n+const value = true;';
    assert.strictEqual(truncateDiff(diff, diff.length), diff);
  });

  test('truncates at the last complete line and adds a notice', () => {
    const diff = 'first line\nsecond line\nthird line';
    const result = truncateDiff(diff, 23);

    assert.strictEqual(result, 'first line\nsecond line\n\n[... diff truncated due to size ...]');
  });

  test('handles long diffs without newlines', () => {
    const result = truncateDiff('abcdefghij', 5);
    assert.strictEqual(result, 'abcde\n\n[... diff truncated due to size ...]');
  });

  test('builds localized prompts with the requested body mode', () => {
    const spanishPrompt = USER_PROMPT_TEMPLATE('sample diff', 'es', true);
    const englishPrompt = USER_PROMPT_TEMPLATE('sample diff', 'en', false);

    assert.match(spanishPrompt, /Language: Spanish/);
    assert.match(spanishPrompt, /Include a detailed body/);
    assert.match(englishPrompt, /Language: English/);
    assert.match(englishPrompt, /Generate ONLY the subject line/);
    assert.match(SYSTEM_PROMPT, /max 72 characters/);
  });
});

suite('Settings manifest', () => {
  const settings = manifest.contributes.configuration.properties;

  test('validates the staged diff limit', () => {
    const maxDiffSize = settings['cleancommit.maxDiffSize'];
    assert.strictEqual(maxDiffSize.default, 12000);
    assert.strictEqual(maxDiffSize.minimum, 1000);
    assert.strictEqual(maxDiffSize.maximum, 100000);
    assert.strictEqual(maxDiffSize.multipleOf, 500);
  });

  test('uses window-scoped user settings', () => {
    const expectedSettings = [
      'cleancommit.provider',
      'cleancommit.language',
      'cleancommit.includeBody',
      'cleancommit.maxDiffSize',
      'cleancommit.confirmBeforeCommit',
    ];

    for (const settingName of expectedSettings) {
      assert.strictEqual(settings[settingName]?.scope, 'window');
    }
  });
});

suite('Extension commands', () => {
  test('registers all contributed CleanCommit commands', async () => {
    const extension = vscode.extensions.getExtension('brandonpalmeros.clean-commit');
    assert.ok(extension, 'CleanCommit development extension was not found');
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('cleancommit.generateCommit'));
    assert.ok(commands.includes('cleancommit.setApiKey'));
    assert.ok(commands.includes('cleancommit.resetModel'));
  });
});
