declare module 'nife-external' {
  import Nife = require('nife');
  export default Nife;
}

declare module 'nife' {
  interface GenericObject {
    [ key: string ]: any;
  }

  namespace Nife {
    function extend(objOrFlags: GenericObject | Array<any> | boolean | number, ...args: Array<GenericObject>): GenericObject | Array<any>;
    function toArray<T>(value: T): Array<T>;
    function get(context: GenericObject | Array<any> | null | undefined, path: string, defaultValue?: any): any;
    function set(context: GenericObject | Array<any>, path: string, value: any): string;

    function instanceOf(value: any, ...args: Array<any>): boolean;

    function iterate<T>(
      collection:
        Array<any>
        | { [ key: string ]: any }
        | Set<any>
        | Map<string, any>,
      runner: (
        args: {
          type: string,
          key: any,
          index: number,
          value: any,
          collection: any,
          context: T,
          stop: () => boolean,
          isStopped: () => boolean
        }
      ) => void,
      context?: T,
    ): T;
  }

  export = Nife;
}
