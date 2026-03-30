import { subcommands } from 'cmd-ts';
import { palette } from './commands/palette.js';

export const utilsCommands = subcommands({
  name: 'utils',
  cmds: {
    palette: palette
  }
});
