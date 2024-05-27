require('dotenv').config();
const express = require('express'); 
const app = express(); 
const PORT = process.env.SERVER_PORT || 5000; 
const botRouter = require('./application/routes/botRouter');

const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
}

start();

