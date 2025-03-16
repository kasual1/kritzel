export class ObjectHelper {
    static toPlainObject(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
          return obj;
        }
      
        if (Array.isArray(obj)) {
          return obj.map((item) => this.toPlainObject(item));
        }
      
        const plainObject: Record<string, any> = {};
        Object.keys(obj).forEach((key) => {
          const value = obj[key];
          plainObject[key] = this.toPlainObject(value);
        });
      
        return plainObject;
      }
}