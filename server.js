// server.js
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://draganarapovic_db_user:6rgKcBYqIXeEOtaM@steamv2.rb0dstd.mongodb.net/steamv2_normalized_test?appName=SteamV2";
const DB_NAME = "steamv2_normalized_test";

let db;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static('public'));

app.use(expressLayouts);
app.set('layout', 'layout');

app.set('view engine', 'ejs');

// Connect to MongoDB
async function connectDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Routes

// Home page
app.get('/', async (req, res) => {
  try {
    const stats = {
      users: await db.collection('app_user').countDocuments(),
      games: await db.collection('game').countDocuments(),
      libraryEntries: await db.collection('library_entry').countDocuments()
    };
    res.render('index', { stats, active: 'home' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// ==================== APP_USER ROUTES ====================

// List all users
app.get('/users', async (req, res) => {
  try {
    const users = await db.collection('app_user').find({}).toArray();
    res.render('users/list', { users, active: 'users' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show create user form
app.get('/users/new', (req, res) => {
  res.render('users/new', { active: 'users' });
});

// Create new user
app.post('/users', async (req, res) => {
  try {
    const { username, email, display_name, country_code, wallet_balance } = req.body;
    
    const newUser = {
      username,
      email,
      display_name,
      country_code,
      wallet_balance: parseFloat(wallet_balance) || 0,
      is_banned: false,
      friends: [],
      password_hash: "default_hash",
      created_at: new Date()
    };
    
    await db.collection('app_user').insertOne(newUser);
    res.redirect('/users');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show single user
app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.collection('app_user').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).render('error', { error: 'User not found' });
    }
    res.render('users/show', { user, active: 'users' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show edit user form
app.get('/users/:id/edit', async (req, res) => {
  try {
    const user = await db.collection('app_user').findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).render('error', { error: 'User not found' });
    }
    res.render('users/edit', { user, active: 'users' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    const { username, email, display_name, country_code, wallet_balance, is_banned } = req.body;
    
    const updatedUser = {
      username,
      email,
      display_name,
      country_code,
      wallet_balance: parseFloat(wallet_balance) || 0,
      is_banned: is_banned === 'on' || is_banned === true
    };
    
    await db.collection('app_user').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedUser }
    );
    res.redirect('/users');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    await db.collection('app_user').deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/users');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// ==================== GAME ROUTES ====================

// List all games
app.get('/games', async (req, res) => {
  try {
    const games = await db.collection('game').find({}).toArray();
    res.render('games/list', { games, active: 'games' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show create game form
app.get('/games/new', (req, res) => {
  res.render('games/new', { active: 'games' });
});

// Create new game
app.post('/games', async (req, res) => {
  try {
    const { title, description, base_price, age_rating, platforms, genres, developer_name, developer_country, developer_founded, publisher_name, publisher_country, is_early_access } = req.body;
    
    const newGame = {
      title,
      description,
      base_price: parseFloat(base_price) || 0,
      age_rating: parseInt(age_rating) || 0,
      platforms: platforms.split(',').map(p => p.trim()).filter(p => p),
      genres: genres.split(',').map(g => g.trim()).filter(g => g),
      developer: {
        name: developer_name,
        country_code: developer_country,
        founded_year: parseInt(developer_founded) || 2020
      },
      publisher: {
        name: publisher_name,
        country_code: publisher_country
      },
      is_early_access: is_early_access === 'on' || is_early_access === true,
      release_date: new Date()
    };
    
    await db.collection('game').insertOne(newGame);
    res.redirect('/games');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show single game
app.get('/games/:id', async (req, res) => {
  try {
    const game = await db.collection('game').findOne({ _id: new ObjectId(req.params.id) });
    if (!game) {
      return res.status(404).render('error', { error: 'Game not found' });
    }
    res.render('games/show', { game, active: 'games' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show edit game form
app.get('/games/:id/edit', async (req, res) => {
  try {
    const game = await db.collection('game').findOne({ _id: new ObjectId(req.params.id) });
    if (!game) {
      return res.status(404).render('error', { error: 'Game not found' });
    }
    res.render('games/edit', { game, active: 'games' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Update game
app.put('/games/:id', async (req, res) => {
  try {
    const { title, description, base_price, age_rating, platforms, genres, developer_name, developer_country, developer_founded, publisher_name, publisher_country, is_early_access } = req.body;
    
    const updatedGame = {
      title,
      description,
      base_price: parseFloat(base_price) || 0,
      age_rating: parseInt(age_rating) || 0,
      platforms: platforms.split(',').map(p => p.trim()).filter(p => p),
      genres: genres.split(',').map(g => g.trim()).filter(g => g),
      developer: {
        name: developer_name,
        country_code: developer_country,
        founded_year: parseInt(developer_founded) || 2020
      },
      publisher: {
        name: publisher_name,
        country_code: publisher_country
      },
      is_early_access: is_early_access === 'on' || is_early_access === true
    };
    
    await db.collection('game').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedGame }
    );
    res.redirect('/games');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Delete game
app.delete('/games/:id', async (req, res) => {
  try {
    await db.collection('game').deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/games');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// ==================== LIBRARY ENTRY ROUTES ====================

// List all library entries
app.get('/library', async (req, res) => {
  try {
    const entries = await db.collection('library_entry').find({}).toArray();
    
    // Fetch user information for each entry
    for (let entry of entries) {
      if (entry.user_id) {
        const user = await db.collection('app_user').findOne({ _id: new ObjectId(entry.user_id) });
        entry.user = user;
      }
    }
    
    res.render('library/list', { entries, active: 'library' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show create library entry form
app.get('/library/new', async (req, res) => {
  try {
    const users = await db.collection('app_user').find({}).toArray();
    const games = await db.collection('game').find({}).toArray();
    res.render('library/new', { users, games, active: 'library' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Create new library entry
app.post('/library', async (req, res) => {
  try {
    const { user_id, game_id, playtime_minutes, is_hidden } = req.body;
    
    const game = await db.collection('game').findOne({ _id: new ObjectId(game_id) });
    
    const newEntry = {
      user_id: new ObjectId(user_id),
      game_snapshot: {
        game_id: new ObjectId(game_id),
        title: game.title,
        base_price: game.base_price
      },
      playtime_minutes: parseInt(playtime_minutes) || 0,
      is_hidden: is_hidden === 'on' || is_hidden === true,
      acquired_at: new Date(),
      last_played_at: new Date()
    };
    
    await db.collection('library_entry').insertOne(newEntry);
    res.redirect('/library');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show single library entry
app.get('/library/:id', async (req, res) => {
  try {
    const entry = await db.collection('library_entry').findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) {
      return res.status(404).render('error', { error: 'Library entry not found' });
    }
    
    const user = await db.collection('app_user').findOne({ _id: new ObjectId(entry.user_id) });
    const game = await db.collection('game').findOne({ _id: new ObjectId(entry.game_snapshot.game_id) });
    
    entry.user = user;
    entry.game = game;
    
    res.render('library/show', { entry, active: 'library' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Show edit library entry form
app.get('/library/:id/edit', async (req, res) => {
  try {
    const entry = await db.collection('library_entry').findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) {
      return res.status(404).render('error', { error: 'Library entry not found' });
    }
    res.render('library/edit', { entry, active: 'library' });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Update library entry
app.put('/library/:id', async (req, res) => {
  try {
    const { playtime_minutes, is_hidden } = req.body;
    
    const updatedEntry = {
      playtime_minutes: parseInt(playtime_minutes) || 0,
      is_hidden: is_hidden === 'on' || is_hidden === true,
      last_played_at: new Date()
    };
    
    await db.collection('library_entry').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedEntry }
    );
    res.redirect('/library');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Delete library entry
app.delete('/library/:id', async (req, res) => {
  try {
    await db.collection('library_entry').deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/library');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});