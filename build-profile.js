#!/usr/bin/env node
// Build a .streamDeckProfile bundle for Claude CLI control (Galleon 100 SD / 3x4 keypad).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = __dirname;
const ICONS = path.join(ROOT, 'icons');
const BUILD = path.join(ROOT, 'build');
const uuid = () => crypto.randomUUID();
const PROFILE_NAME = 'Claude CLI';
const DEVICE = { Model: 'GRETSCH', UUID: uuid() }; // export uses a plain uuid, not @(1)[...]

// reset build
fs.rmSync(BUILD, { recursive: true, force: true });

// EXPORT layout (matches real Stream Deck export):
//   EXPORT_ROOT/
//     package.json
//     Profiles/<sdProfileUUID>.sdProfile/
//       manifest.json  (Device, Name, Pages)
//       Profiles/<pageUUID>/  (manifest.json + Images/)
const EXPORT_ROOT = path.join(BUILD, 'export');
const sdProfileId = uuid().toUpperCase();
const BUNDLE = path.join(EXPORT_ROOT, 'Profiles', `${sdProfileId}.sdProfile`);
const pageId = uuid();
const pageDir = pageId.toUpperCase(); // SD uses uppercase dir names (dashes kept)
const innerDir = path.join(BUNDLE, 'Profiles', pageDir);
const imgDir = path.join(innerDir, 'Images');
fs.mkdirSync(imgDir, { recursive: true });
fs.mkdirSync(path.join(BUNDLE, 'Images'), { recursive: true });

// ---- helpers to build actions ----
function copyImage(file) {
  const dst = `Images/${path.basename(file, '.png')}.png`;
  fs.copyFileSync(path.join(ICONS, file), path.join(innerDir, dst));
  return dst;
}

// system.text action: types text, optionally presses Enter
function textAction(icon, label, text, sendEnter) {
  return {
    ActionID: uuid(),
    LinkedTitle: false,
    Name: 'Text',
    Plugin: { Name: 'Text', UUID: 'com.elgato.streamdeck.system.text', Version: '1.0' },
    Resources: null,
    Settings: {
      Hotkey: { KeyModifiers: 0, QTKeyCode: 33554431, VKeyCode: -1 },
      isSendingEnter: !!sendEnter,
      isTypingMode: false,
      pastedText: text,
    },
    State: 0,
    States: [{ Image: copyImage(icon), Title: '' }],
    UUID: 'com.elgato.streamdeck.system.text',
  };
}

// hotkey action: presses a key combo (used for Esc, Ctrl+C, Enter)
function hotkeyAction(icon, hk) {
  return {
    ActionID: uuid(),
    LinkedTitle: false,
    Name: 'Hotkey',
    Plugin: { Name: 'Hotkey', UUID: 'com.elgato.streamdeck.system.hotkey', Version: '1.0' },
    Resources: null,
    Settings: { Hotkeys: [hk] },
    State: 0,
    States: [{ Image: copyImage(icon), Title: '' }],
    UUID: 'com.elgato.streamdeck.system.hotkey',
  };
}
// open app/path (no icon — used as a step inside a multi-action)
function openStep(appPath) {
  return {
    ActionID: uuid(),
    LinkedTitle: true,
    Name: 'Open',
    Plugin: { Name: 'Open', UUID: 'com.elgato.streamdeck.system.open', Version: '1.0' },
    Resources: null,
    Settings: { path: `"${appPath}"` },
    State: 0,
    States: [{}],
    UUID: 'com.elgato.streamdeck.system.open',
  };
}

// text step (no icon) — used inside a multi-action
function textStep(text) {
  return {
    ActionID: uuid(),
    LinkedTitle: true,
    Name: 'Text',
    Plugin: { Name: 'Text', UUID: 'com.elgato.streamdeck.system.text', Version: '1.0' },
    Resources: null,
    Settings: {
      Hotkey: { KeyModifiers: 0, QTKeyCode: 33554431, VKeyCode: -1 },
      isSendingEnter: false, isTypingMode: false, pastedText: text,
    },
    State: 0, States: [{}],
    UUID: 'com.elgato.streamdeck.system.text',
  };
}

// delay step (pause between multi-action steps). Delay in seconds.
function delayStep(seconds) {
  return {
    ActionID: uuid(),
    Name: 'Delay',
    Plugin: { Name: 'Delay', UUID: 'com.elgato.streamdeck.multiactions.delay', Version: '1.0' },
    Resources: null,
    Settings: { Delay: seconds },
    State: 0, States: [{}],
    UUID: 'com.elgato.streamdeck.multiactions.delay',
  };
}

// multi-action button: runs an ordered list of steps. Each step wrapped as {Actions:[step]}.
function multiAction(icon, steps) {
  return {
    ActionID: uuid(),
    Actions: steps.map((s) => ({ Actions: [s] })),
    LinkedTitle: false,
    Name: 'Multi Action',
    Plugin: { Name: 'Multi Action', UUID: 'com.elgato.streamdeck.multiactions', Version: '1.0' },
    Resources: null,
    Settings: {},
    State: 0,
    States: [{ Image: copyImage(icon), Title: '' }],
    UUID: 'com.elgato.streamdeck.multiactions.routine',
  };
}

// QT/VK codes: Esc QT=16777216 VK=53 ; C VK=8 QTKeyCode=67 ; Return QT=16777220 VK=36
const HK_ESC = { KeyCmd: false, KeyCtrl: false, KeyModifiers: 0, KeyOption: false, KeyShift: false, NativeCode: 53, QTKeyCode: 16777216, VKeyCode: 53 };
const HK_CTRL_C = { KeyCmd: false, KeyCtrl: true, KeyModifiers: 2, KeyOption: false, KeyShift: false, NativeCode: 8, QTKeyCode: 67, VKeyCode: 67 };
const HK_ENTER = { KeyCmd: false, KeyCtrl: false, KeyModifiers: 0, KeyOption: false, KeyShift: false, NativeCode: 36, QTKeyCode: 16777220, VKeyCode: 36 };

// ---- layout 3 rows x 4 cols (row,col) ----
const actions = {
  // New = open Terminal, then type `claude` + Enter to launch Claude CLI
  // Launch = open Terminal app
  '0,0': (() => {
    const a = openStep('/System/Applications/Utilities/Terminal.app');
    a.LinkedTitle = false;
    a.States = [{ Image: copyImage('01-launch.png'), Title: '' }];
    return a;
  })(),
  '0,1': textAction('13-claude.png',    'Claude', 'claude\n', false),
  '0,2': textAction('14-cook.png',      'Cook',   '/cook\n', false),
  '0,3': textAction('04-reasoning.png', 'Reason', '/reasoning\n', false),

  '1,0': textAction('05-plan.png',      'Plan',   '/plan\n', false),
  '1,1': hotkeyAction('06-stop.png',    HK_ESC),
  '1,2': hotkeyAction('07-cancel.png',  HK_CTRL_C),
  '1,3': hotkeyAction('08-enter.png',   HK_ENTER),

  '2,0': textAction('09-continue.png',  'Go',     'tiếp tục\n', false),
  '2,1': textAction('10-commit.png',    'Push',   'commit và push các thay đổi giúp anh\n', false),
  '2,2': textAction('02-reset.png',     'Reset',  '/reset\n', false),
  '2,3': textAction('12-explain.png',   'Debug',  'giải thích lỗi vừa rồi và đề xuất cách sửa\n', false),
};

// wallpaper: Stream Deck stores the LCD background as Encoder.Background (720x384 PNG)
const wpSrc = path.join(ICONS, 'wallpaper-720x384.png');
let bgRef = '';
if (fs.existsSync(wpSrc)) {
  const dst = 'Images/wallpaper.png';
  fs.copyFileSync(wpSrc, path.join(innerDir, dst));
  bgRef = dst;
}

// encoder (dials) — must exist for Galleon; carries the LCD wallpaper as Background
const encoderActions = {};
const encoderController = { Actions: encoderActions, Type: 'Encoder' };
if (bgRef) encoderController.Background = bgRef;
const inner = {
  Controllers: [
    { Actions: actions, Type: 'Keypad' },
    encoderController,
  ],
  Icon: '', Name: '',
};
fs.writeFileSync(path.join(innerDir, 'manifest.json'), JSON.stringify(inner));

// top manifest (.sdProfile/manifest.json) — Current=0s like the real export
const top = {
  Device: DEVICE,
  Name: PROFILE_NAME,
  Pages: { Current: '00000000-0000-0000-0000-000000000000', Default: pageId, Pages: [pageId] },
  Version: '3.0',
};
fs.writeFileSync(path.join(BUNDLE, 'manifest.json'), JSON.stringify(top));

// package.json at export root (REQUIRED for import to work)
const pkg = {
  AppVersion: '7.4.2.22730',
  DeviceModel: 'GRETSCH',
  DeviceSettings: null,
  FormatVersion: 1,
  OSType: 'Mac',
  OSVersion: '14.0',
  RequiredPlugins: [
    'com.elgato.streamdeck.system.text',
    'com.elgato.streamdeck.system.hotkey',
  ],
};
fs.writeFileSync(path.join(EXPORT_ROOT, 'package.json'), JSON.stringify(pkg));

// zip the CONTENTS of export root (package.json + Profiles/) into .streamDeckProfile
const out = path.join(BUILD, `${PROFILE_NAME}.streamDeckProfile`);
fs.rmSync(out, { force: true });
execSync(`cd "${EXPORT_ROOT}" && zip -r -X "${out}" package.json Profiles >/dev/null`);
console.log('Built:', out);
console.log('Bundle dir:', BUNDLE);
