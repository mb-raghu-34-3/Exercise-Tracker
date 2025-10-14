const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser')
const crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//new user
const users = {};


// Create new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: 'Username required' });

  const _id = generateId();
  users[_id] = { username, _id, log: [] };

  res.json({ username, _id });
});

// Get all users
app.get('/api/users', (req, res) => {
  const result = Object.values(users).map(({ _id, username }) => ({ _id, username }));
  res.json(result);
});

// Add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;
  const user = users[req.params._id];

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!description || !duration) return res.status(400).json({ error: 'Description and duration required' });

  const parsedDate = date ? date : new Date().toISOString().substring(0, 10);;
  if (parsedDate.toString() === 'Invalid Date') return res.json({ error: 'Invalid Date' });

  const exercise = {
    description,
    duration: parseInt(duration),
    date: parsedDate
  };

  user.log.push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString(),
  });
});

// Get logs
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users[req.params._id];
  if (!user) return res.status(404).json({ error: 'User not found' });

  let log = [...user.log];

  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    if (fromDate.toString() !== 'Invalid Date') {
      log = log.filter(e => new Date(e.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (toDate.toString() !== 'Invalid Date') {
      log = log.filter(e => new Date(e.date) <= toDate);
    }
  }

  if (limit) {
    const num = parseInt(limit);
    if (!isNaN(num)) {
      log = log.slice(0, num);
    }
  }
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log : log.map((exercise) => {
		return {
			description: exercise.description,
			duration: exercise.duration,
			date: new Date(exercise.date).toDateString(),
		}
	  })
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
