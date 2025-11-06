
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// GET all tasks
app.get('/api', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(200).json(data);
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
  const { task_name, is_completed } = req.body;

  if (!task_name) {
    return res.status(400).json({ error: 'task_name is required' });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ task_name, is_completed: is_completed || false }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
