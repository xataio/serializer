// These will be used to set special fields to serialized objects.
// So objects should not use this field names. I think that's fine. Another approach would be to generate two objects:
// One containing the "data tree" and another containing the a tree with the type information.
const META = '__'
const VALUE = '___'

class Serializer {
  classes = {}

  add(clazz) {
    this.classes[clazz.name] = clazz
  }

  toJSON(data) {
    // We are not using JSON.stringify() and the replacer function here, because the replacer receives
    // the result of toJSON() if the object has a toJSON() method. This is a problem for the Date type:
    // we get a string, because Date.toJSON() returns the date formatted into a ISO string alreayd,
    // so it's not possible to guess the type of the original object.
    function visit(obj) {
      if (Array.isArray(obj)) return obj.map(visit)

      const type = typeof obj
      if (type === 'undefined') return {[META]: 'undefined'}
      if (type === 'bigint') return {[META]: 'bigint', [VALUE]: obj.toString()}
      if (obj === null || type !== 'object') return obj

      const constructor = obj.constructor
      const o = {[META]: constructor.name}
      for (const [key, value] of Object.entries(obj)) {
        o[key] = visit(value)
      }
      if (constructor === Date) o[VALUE] = obj.toISOString()
      if (constructor === Map) o[VALUE] = Object.fromEntries(obj)
      if (constructor === Set) o[VALUE] = [...obj]
      return o
    }
    return JSON.stringify(visit(data))
  }

  fromJSON(json) {
    return JSON.parse(json, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const {[META]: clazz, [VALUE]: val, ...rest} = value
        const constructor = this.classes[clazz]
        if (constructor) {
          return Object.assign(Object.create(constructor.prototype), rest)
        }
        if (clazz === 'Date') return new Date(val)
        if (clazz === 'Set') return new Set(val)
        if (clazz === 'Map') return new Map(Object.entries(val))
        if (clazz === 'bigint') return BigInt(val)
        // TODO: this is ignored. In order to support undefined we'd need to traverse the JSON tree ourselves.
        // Instead of using the JSON.parse() reviver argument.
        if (clazz === 'undefined') return undefined
        return rest
      }
      return value
    })
  }
}

class Person {
  constructor() {
    console.log('this is not called from Serializer.fromJSON')
  }

  init() {
    this.dateOfBirth = new Date('1984-06-16')

    this.set = new Set([1, 2, 3]);
    this.map = new Map();
    this.map.set('a', 1);
    this.n = 100
    this.b = true
    // this.u = undefined // Not supported. JSON.parse() ignores undefined values
    this.nil = null;
    this.arr = [1, 2, 3]
    this.big = BigInt(9007199254740991)
  }

  age() {
    // Simplified implementation
    return new Date().getFullYear() - this.dateOfBirth.getFullYear()
  }
}

const original = new Person()
console.log('---')
original.init()

const serializer = new Serializer()
serializer.add(Person)

console.log('original\n ', original)
console.log('original age\n ', original.age())

const json = serializer.toJSON(original)
console.log('json\n ', json)

console.log('parsed\n ', serializer.fromJSON(json))
console.log('parsed age\n ', serializer.fromJSON(json).age())
