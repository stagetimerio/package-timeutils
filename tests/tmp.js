// TZ='UTC' node tests/tmp.js
// TZ='Europe/Berlin' node tests/tmp.js
// TZ='America/Los_Angeles' node tests/tmp.js
// TZ='Australia/Sydney' node tests/tmp.js

const date1 = new Date('2023-09-30T15:10:00.000Z')
console.log('[1]', date1, date1.toString())

const date2 = new Date('2023-10-02T03:33:33.000Z')
console.log('[2]', date2, date2.toString())

const date3 = new Date('2023-10-01T15:10:00.000Z')
console.log('[3]', date3, date3.toString())

