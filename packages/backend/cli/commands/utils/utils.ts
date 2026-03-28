import { subcommands } from 'cmd-ts';
import { palette } from './commands/palette';

export const utilsCommands = subcommands({
  name: 'utils',
  cmds: {
    palette: palette
  }
});
