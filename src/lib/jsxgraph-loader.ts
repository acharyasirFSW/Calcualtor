// @ts-ignore
import JXGModule from 'jsxgraph';

export const getJXG = () => {
  if (typeof window !== 'undefined' && (window as any).JXG) {
    return (window as any).JXG;
  }
  return JXGModule;
};
