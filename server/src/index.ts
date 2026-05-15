import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const IS_PROD = process.env.NODE_ENV === 'production'

app.use(express.json())
app.use(cors({ origin: IS_PROD ? false : 'http://localhost:5173' }))

// Health check
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true })
})

// Serve React app in production
if (IS_PROD) {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Bevervision server running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`)
})
