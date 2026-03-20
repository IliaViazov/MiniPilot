A variaton of Pilot synthesizer for ORCA, with some exceptions. The synthesizers are preprogrammed (for now), instead of UDP message for the note events it uses MIDI, for the rest of the functions it is the same. 
Message ```;0ENVFFFF``` will cause change of the envelope for a corresponding synth. 
The message like ```;BITFF``` will cause the change of a corresponding effect, where first letter is intensity of the effect, and second the mix.

The installation/running is the next.

Web version:
```bash
npm install
npm start
```

Desktop version to build:
```bash
npm install @electron/packager --save-dev
npx electron-packager . MiniPilot --platform=darwin --arch=arm64
```

P.s. You may receive an error "the application is damaged", due to the MacOS quarantine restrictions. To remove it you just need to run:
```bash
xattr -cr <path>/MiniPilot.app
```