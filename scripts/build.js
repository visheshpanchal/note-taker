import { build } from 'electron-builder'

const flag = process.argv.find(a => a.startsWith('--'))

const config = {
  appId: 'com.notetaker.app',
  productName: 'NoteTaker',
  directories: { output: 'release' },
  files: ['dist/**/*', 'electron/**/*'],
  mac: {
    category: 'public.app-category.productivity',
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
  },
  win: { target: [{ target: 'nsis', arch: ['x64'] }] },
  linux: { target: [{ target: 'AppImage', arch: ['x64'] }], category: 'Office' },
}

const targets = {}
if (flag === '--mac') targets.mac = ['dmg']
else if (flag === '--win') targets.win = ['nsis']
else if (flag === '--linux') targets.linux = ['AppImage']
else if (flag === '--all') { targets.mac = ['dmg']; targets.win = ['nsis']; targets.linux = ['AppImage'] }

build({ config, ...targets })
  .then(result => console.log('Build complete:', result))
  .catch(err => { console.error('Build failed:', err); process.exit(1) })
