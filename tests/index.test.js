import { default as chai } from 'chai'
const { expect } = chai

const TZ = {
  name: Intl.DateTimeFormat().resolvedOptions().timeZone,
  offset: new Date().getTimezoneOffset(),
  now: new Date(),
}
beforeAll(() => {
  console.info(`
    Timezone
    name: '${TZ.name}'
    offset: '${TZ.offset}'
    now: '${new Date()}' '${TZ.now.toISOString()}'
  `)
})

test('timeUtils', () => { expect(true).to.be.true })

