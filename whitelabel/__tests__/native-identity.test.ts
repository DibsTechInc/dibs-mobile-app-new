/**
 * The chimera-build guard. See `whitelabel/native-identity.ts` for the incident these encode.
 *
 * Built on a real temp directory rather than a mocked `fs`: the thing under test is "what does a
 * generated Xcode project on disk actually say", and a mock would only assert that this file and
 * the reader agree about a shape neither of them owns.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  assertNativeProjectsMatchStudio,
  expectedAndroidPackage,
  expectedIosBundleId,
  isPrebuilding,
  mismatchMessage,
  readAndroidPackage,
  readIosBundleId,
} from '../native-identity';

function makeProjectRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dibs-native-identity-'));
}

function writeIosProject(root: string, name: string, bundleId: string): void {
  const dir = path.join(root, 'ios', `${name}.xcodeproj`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'project.pbxproj'),
    [
      'buildSettings = {',
      `\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`,
      '\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";',
      '};',
      'buildSettings = {',
      `\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`,
      '};',
    ].join('\n'),
  );
}

function writeAndroidProject(root: string, applicationId: string): void {
  const dir = path.join(root, 'android', 'app');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'build.gradle'),
    `android {\n  defaultConfig {\n    applicationId '${applicationId}'\n  }\n}\n`,
  );
}

const NOT_PREBUILD = ['/usr/bin/node', '/repo/node_modules/.bin/expo', 'run:ios'];

describe('expected identifiers', () => {
  it('prefers the studio-declared bundle id, which is what a real store app carries', () => {
    expect(expectedIosBundleId('everyday-ballet', 'com.ondibs.everydayballetapp')).toBe(
      'com.ondibs.everydayballetapp',
    );
  });

  it('falls back to a dev id derived from the slug, with hyphens stripped', () => {
    expect(expectedIosBundleId('carlsbad-village-yoga', null)).toBe(
      'com.ondibs.dev.carlsbadvillageyoga',
    );
    expect(expectedAndroidPackage('carlsbad-village-yoga', undefined)).toBe(
      'com.ondibs.dev.carlsbadvillageyoga',
    );
  });
});

describe('isPrebuilding', () => {
  it('stands aside for the command that fixes the problem', () => {
    expect(isPrebuilding(['node', 'expo', 'prebuild', '--clean'])).toBe(true);
    expect(isPrebuilding(['node', '/repo/node_modules/.bin/prebuild'])).toBe(true);
  });

  it('does not stand aside for a build or a dev server', () => {
    expect(isPrebuilding(NOT_PREBUILD)).toBe(false);
    expect(isPrebuilding(['node', 'expo', 'start'])).toBe(false);
  });

  it('is not fooled by a path that merely contains the word', () => {
    expect(isPrebuilding(['node', '/Users/me/prebuild-notes/expo', 'run:ios'])).toBe(false);
  });
});

describe('reading an existing native project', () => {
  it('returns null when there is no native project to contradict the studio', () => {
    const root = makeProjectRoot();
    expect(readIosBundleId(root)).toBeNull();
    expect(readAndroidPackage(root)).toBeNull();
  });

  it('reads the literal from project.pbxproj, whatever the .xcodeproj is named', () => {
    const root = makeProjectRoot();
    writeIosProject(root, 'CarlsbadVillageYoga', 'com.ondibs.carlsbadvillageyogaapp');
    expect(readIosBundleId(root)).toBe('com.ondibs.carlsbadvillageyogaapp');
  });

  it('reads applicationId from the android gradle file', () => {
    const root = makeProjectRoot();
    writeAndroidProject(root, 'com.ondibs.carlsbadvillageyogaapp');
    expect(readAndroidPackage(root)).toBe('com.ondibs.carlsbadvillageyogaapp');
  });
});

describe('assertNativeProjectsMatchStudio', () => {
  const EB = {
    slug: 'everyday-ballet',
    iosBundleId: 'com.ondibs.everydayballetapp',
    androidPackage: 'com.ondibs.everydayballetapp',
  };

  it('throws on the exact 2026-08-07 case: Everyday Ballet built on a Carlsbad ios/', () => {
    const root = makeProjectRoot();
    writeIosProject(root, 'CarlsbadVillageYoga', 'com.ondibs.carlsbadvillageyogaapp');

    expect(() =>
      assertNativeProjectsMatchStudio({ ...EB, projectRoot: root, argv: NOT_PREBUILD }),
    ).toThrow(/Stale ios\/ native project/);
  });

  it('names both ids and the fix, since the symptom does not point at a stale directory', () => {
    const root = makeProjectRoot();
    writeIosProject(root, 'CarlsbadVillageYoga', 'com.ondibs.carlsbadvillageyogaapp');

    let message = '';
    try {
      assertNativeProjectsMatchStudio({ ...EB, projectRoot: root, argv: NOT_PREBUILD });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('com.ondibs.carlsbadvillageyogaapp');
    expect(message).toContain('com.ondibs.everydayballetapp');
    expect(message).toContain('npx expo prebuild --clean');
  });

  it('passes when the native project belongs to the same studio', () => {
    const root = makeProjectRoot();
    writeIosProject(root, 'EverydayBallet', 'com.ondibs.everydayballetapp');
    writeAndroidProject(root, 'com.ondibs.everydayballetapp');

    expect(() =>
      assertNativeProjectsMatchStudio({ ...EB, projectRoot: root, argv: NOT_PREBUILD }),
    ).not.toThrow();
  });

  it('passes when there is no native project yet, because prebuild will create the right one', () => {
    const root = makeProjectRoot();
    expect(() =>
      assertNativeProjectsMatchStudio({ ...EB, projectRoot: root, argv: NOT_PREBUILD }),
    ).not.toThrow();
  });

  it('does NOT block prebuild itself, or the guard would deadlock the only fix', () => {
    const root = makeProjectRoot();
    writeIosProject(root, 'CarlsbadVillageYoga', 'com.ondibs.carlsbadvillageyogaapp');

    expect(() =>
      assertNativeProjectsMatchStudio({
        ...EB,
        projectRoot: root,
        argv: ['node', 'expo', 'prebuild', '--clean'],
      }),
    ).not.toThrow();
  });

  it('catches an android-only mismatch when ios/ is absent or already correct', () => {
    const root = makeProjectRoot();
    writeIosProject(root, 'EverydayBallet', 'com.ondibs.everydayballetapp');
    writeAndroidProject(root, 'com.ondibs.carlsbadvillageyogaapp');

    expect(() =>
      assertNativeProjectsMatchStudio({ ...EB, projectRoot: root, argv: NOT_PREBUILD }),
    ).toThrow(/Stale android\/ native project/);
  });
});

describe('mismatchMessage', () => {
  it('survives a null found id without printing "null" as a studio name', () => {
    const message = mismatchMessage({
      slug: 'everyday-ballet',
      platform: 'ios',
      expected: 'com.ondibs.everydayballetapp',
      found: null,
    });
    expect(message).not.toMatch(/\bnull's\b/);
  });
});
