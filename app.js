const express = require('express');
const { engine } = require('express-handlebars');
const Handlebars = require("handlebars");
const helpers = require('./helpers/handlebars');

const app = express()

app.engine('handlebars', engine({
	helpers: helpers,
	defaultLayout: 'main' // Specify default template views/layout/main.handlebar 
}));
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
  res.render('index')
})

const port = 5000

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
})



