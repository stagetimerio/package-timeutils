// TZ='UTC' node tests/tmp.js
// TZ='Europe/Berlin' node tests/tmp.js
// TZ='America/Los_Angeles' node tests/tmp.js
// TZ='Australia/Sydney' node tests/tmp.js

const date1 = new Date('2023-06-09T19:30:00.000Z')
console.log('[1]', date1, date1.toString())

const date2 = new Date('2024-10-07T17:13:49.000Z')
console.log('[2]', date2, date2.toString())

const date3 = new Date('2024-10-08T01:30:00.000Z')
console.log('[3]', date3, date3.toString())

const date4 = new Date('2024-10-08T19:30:00.000Z')
console.log('[4]', date4, date4.toString())

