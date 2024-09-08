const express = require('express')
require('dotenv').config()
const app = express()
app.get('/', (req, res) => {
  res.send('hello world')
})

app.get('/twitter', (req,res) => {
    res.send("sahil.x");
})

app.listen(process.env.PORT, () => {
    console.log(`listerning to port ${process.env.PORT}`);
})
