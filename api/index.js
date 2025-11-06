
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

app.get('/api', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
