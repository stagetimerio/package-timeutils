// TZ='UTC' node tests/tmp.js
// TZ='Europe/Berlin' node tests/tmp.js
// TZ='America/Los_Angeles' node tests/tmp.js
// TZ='Australia/Sydney' node tests/tmp.js

const date1 = new Date('2024-04-10T09:00:00Z')
console.log('[1]', date1, date1.toString())

const date2 = new Date('2024-04-10T14:00:00Z')
console.log('[2]', date2, date2.toString())

const date3 = new Date('2024-04-10T22:00:00Z')
console.log('[3]', date3, date3.toString())

const date4 = new Date('2023-10-02T13:00:00.000Z')
console.log('[4]', date4, date4.toString())

