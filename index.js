const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv')

const app = express();
const port = 3000;
dotenv.config();

app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));

app.listen(port, () =>{
    console.log('App is available on port', port);
});