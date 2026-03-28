import NodeUtil from 'util';

export namespace InspectUtil {
  export const inspect = (data: any, options: Parameters<typeof NodeUtil.inspect>[1] = {}): void => {
    // eslint-disable-next-line no-console
    console.log(
      NodeUtil.inspect(data, {
        depth: null,
        colors: true,
        compact: true,
        showHidden: false,
        ...options
      })
    );
  };
}
