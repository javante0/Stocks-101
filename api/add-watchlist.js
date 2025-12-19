import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const { data, error } = await supabase
        .from('watchlist')
        .insert([{ symbol: symbol.toUpperCase() }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Success' });
}