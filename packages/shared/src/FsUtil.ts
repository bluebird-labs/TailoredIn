import FS from 'node:fs/promises';

export namespace FsUtil {
  export const exists = async (filePath: string): Promise<boolean> => {
    try {
      await FS.access(filePath);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      return false;
    }
  };
}
