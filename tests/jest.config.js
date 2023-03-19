console.info(`
Timezone
name: '${Intl.DateTimeFormat().resolvedOptions().timeZone}'
offset: '${new Date().getTimezoneOffset()}'
now: '${new Date()}' '${new Date().toISOString()}'
`)

export default {
}
