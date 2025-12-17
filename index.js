const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv')

const app = express();
const port = 3000;
dotenv.config();

app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

app.listen(port, () =>{
    console.log('App is available on port', port);
});