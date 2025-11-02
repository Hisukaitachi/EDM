const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(morgan('dev'));

//Healt check route
app.get('/', (req, res) => {
    res.json({ message: 'Inventory API is running!'});
});

//API Routes
app.use('/api', routes);

//Error Handling
app.use(errorHandler);

module.exports = app;