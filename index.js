const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path'); 

const app = express();
const port = 3000;
dotenv.config();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/api/get-watchlist', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('watchlist')
            .select('*');

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/add-watchlist', async (req, res) => {
    try {
        const stockData = req.body; 

        const { data, error } = await supabase
            .from('watchlist')
            .insert([stockData])
            .select();

        if (error) throw error;

        res.status(200).json({ message: 'Stock added!', data });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;

if (require.main === module) {
    app.listen(port, () => {
        console.log(`App is available on port ${port}`);
    });
}