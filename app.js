const express = require('express');
const { engine } = require('express-handlebars');
const Handlebars = require("handlebars");
const path = require('path');
const helpers = require('./helpers/handlebars');


const app = express()

app.engine('handlebars', engine({
	helpers: helpers,
	defaultLayout: 'main' // Specify default template views/layout/main.handlebar 
}));
app.set('view engine', 'handlebars');

app.use(express.urlencoded({
	extended: false
}));
app.use(express.json());

const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(flash());

// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, 'public')));

// mainRoute is declared to point to routes/main.js
const mainRoute = require('./routes/main');
app.use('/', mainRoute);

const port = 5000

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
})



