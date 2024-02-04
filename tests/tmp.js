// TZ='UTC' node tests/tmp.js
// TZ='Europe/Berlin' node tests/tmp.js
// TZ='America/Los_Angeles' node tests/tmp.js
// TZ='Australia/Sydney' node tests/tmp.js

const date1 = new Date('2024-02-04T00:00:00.000Z')
console.log('[1]', date1, date1.toString())

const date2 = new Date('2024-02-03T08:00:00.000Z')
console.log('[2]', date2, date2.toString())

const date3 = new Date('2023-10-02T14:30:00.000Z')
console.log('[3]', date3, date3.toString())

const date4 = new Date('2023-10-02T13:00:00.000Z')
console.log('[4]', date4, date4.toString())

