# Serializer

A parser/serializer that supports serializing many JS built-in types that JSON.parse doesn't support: `Set`, `Map`, `BigInt`, `Date`.

It also supports serializing arbitrary objects and parsing them into their original classes. This requires to use the `serializer.add(Class)` method.

Example:

```js
class Person {
  constructor(dateOfBirth) {
    this.dateOfBirth = dateOfBirth
  }

  age() {
    // Simplified implementation
    return new Date().getFullYear() - this.dateOfBirth.getFullYear()
  }
}

const serializer = new Serializer()
serializer.add(Person)

const original = new Person(new Date('1984-06-16'))

const json = serializer.toJSON(original)
const person = serializer.fromJSON(json)
console.log('age', person.age())
```
