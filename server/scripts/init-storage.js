const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', 'data')
const usersFile = path.join(dataDir, 'users.json')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8')

console.log('Storage initialized:', usersFile)
