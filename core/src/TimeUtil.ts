export namespace TimeUtil {
  export const wait = async (ms: number) => {
    await new Promise(resolve => setTimeout(resolve, ms));
  };

  export const waitRandom = async (min: number, max: number) => {
    const random = Math.floor(Math.random() * (max - min)) + min;
    await wait(random);
  };
}
