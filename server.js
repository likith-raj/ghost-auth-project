const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();

// 🚨 FIX FILE PATHS FOR CLOUD DEPLOYMENT 🚨
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGIN_ATTEMPTS_FILE = path.join(DATA_DIR, 'login_attempts.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Creating new users file...');
    }
    return [];
}

function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Creating new sessions file...');
    }
    return [];
}

function loadLoginAttempts() {
    try {
        if (fs.existsSync(LOGIN_ATTEMPTS_FILE)) {
            const data = fs.readFileSync(LOGIN_ATTEMPTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Creating new login attempts file...');
    }
    return {};
}

// Save data to files
function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('💾 Users saved to file:', users.length, 'total users');
}

function saveSessions() {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function saveLoginAttempts() {
    fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify(loginAttempts, null, 2));
}

// Initialize data
let users = loadUsers();
let sessions = loadSessions();
let loginAttempts = loadLoginAttempts();

// Password strength validation
function validatePassword(password) {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true, message: 'Password is strong' };
}

// Email validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Username validation
function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve dashboard.html
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Ghost Auth API is working! 🎉',
    totalUsers: users.length,
    users: users.map(u => u.username)
  });
});

// Enhanced Register route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    // Validate username
    if (!validateUsername(username)) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores' 
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false,
        message: passwordValidation.message 
      });
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({ 
        success: false,
        message: `User with this ${field} already exists` 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isActive: true,
      lastLogin: null
    };

    users.push(user);
    saveUsers(); // 💾 SAVE TO FILE

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'ghost-secret-key',
      { expiresIn: '24h' }
    );

    // Create session
    const session = {
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    sessions.push(session);
    saveSessions(); // 💾 SAVE TO FILE

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Redirecting to dashboard...',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      redirect: '/dashboard.html'  // 🎯 ADDED REDIRECT
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Enhanced Login route with security features
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Check if all fields are provided
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    // Check for too many failed attempts (5 attempts max)
    if (loginAttempts[username] >= 5) {
      return res.status(429).json({ 
        success: false,
        message: 'Too many failed attempts. Please try again in 15 minutes.' 
      });
    }

    // Find user
    const user = users.find(u => u.email === username || u.username === username);
    
    if (!user) {
      // Increment failed attempts
      loginAttempts[username] = (loginAttempts[username] || 0) + 1;
      saveLoginAttempts(); // 💾 SAVE TO FILE
      
      return res.status(400).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Increment failed attempts
      loginAttempts[username] = (loginAttempts[username] || 0) + 1;
      saveLoginAttempts(); // 💾 SAVE TO FILE
      
      const attemptsLeft = 5 - loginAttempts[username];
      return res.status(400).json({ 
        success: false,
        message: `Invalid username or password. ${attemptsLeft > 0 ? attemptsLeft + ' attempts left' : 'No attempts left'}` 
      });
    }

    // Reset failed attempts on successful login
    delete loginAttempts[username];
    saveLoginAttempts(); // 💾 SAVE TO FILE

    // Update last login
    user.lastLogin = new Date();
    saveUsers(); // 💾 SAVE TO FILE

    // Generate token with different expiration for "remember me"
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'ghost-secret-key',
      { expiresIn: tokenExpiry }
    );

    // Create session
    const session = {
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
    };
    sessions.push(session);
    saveSessions(); // 💾 SAVE TO FILE

    res.json({
      success: true,
      message: 'Login successful! Redirecting to dashboard...',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      expiresIn: tokenExpiry,
      redirect: '/dashboard.html'  // 🎯 ADDED REDIRECT
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    sessions = sessions.filter(s => s.token !== token);
    saveSessions(); // 💾 SAVE TO FILE
  }
  
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

// Check auth status
app.get('/api/check-auth', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, 'ghost-secret-key');
    const user = users.find(u => u.id === decoded.userId);
    
    if (user) {
      res.json({ 
        authenticated: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        } 
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// Get user profile
app.get('/api/profile', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, 'ghost-secret-key');
    const user = users.find(u => u.id === decoded.userId);
    
    if (user) {
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Get all users (for testing)
app.get('/api/users', (req, res) => {
  res.json({ 
    totalUsers: users.length,
    users: users.map(u => ({ 
      username: u.username, 
      email: u.email,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin 
    })) 
  });
});

// Reset failed attempts (for testing)
app.post('/api/reset-attempts', (req, res) => {
  const { username } = req.body;
  if (username) {
    delete loginAttempts[username];
    saveLoginAttempts(); // 💾 SAVE TO FILE
  }
  res.json({ message: 'Login attempts reset' });
});

// View stored data files
app.get('/api/debug/files', (req, res) => {
  res.json({
    usersFile: fs.existsSync(USERS_FILE) ? 'Exists' : 'Missing',
    sessionsFile: fs.existsSync(SESSIONS_FILE) ? 'Exists' : 'Missing',
    loginAttemptsFile: fs.existsSync(LOGIN_ATTEMPTS_FILE) ? 'Exists' : 'Missing',
    totalUsers: users.length,
    totalSessions: sessions.length
  });
});

// 🔥 LAUNCH PYTHON MONITOR ROUTE 🔥
app.post('/launch-monitor', (req, res) => {
    try {
        console.log('🚀 Launching Python monitor...');
        
        // Path to your Python file
        const pythonScriptPath = path.join(__dirname, 'real_monitor.py');
        
        // Launch the Python script
        const pythonProcess = spawn('python', [pythonScriptPath], {
            detached: true,
            stdio: 'ignore',
            cwd: __dirname
        });
        
        pythonProcess.unref(); // Allow Python app to run independently
        
        console.log('✅ Python monitor launched with PID:', pythonProcess.pid);
        
        res.json({ 
            success: true, 
            message: 'Real monitor launched successfully',
            pid: pythonProcess.pid
        });
        
    } catch (error) {
        console.error('❌ Error launching monitor:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
// 🚨 KEEP THIS AT THE VERY END 🚨
// 🚨 KEEP THIS AT THE VERY END 🚨
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Advanced Ghost Auth running on port ${PORT}`);
  console.log(`💾 Data will be saved in ./data/ folder`);
  console.log(`📊 Currently ${users.length} users in database`);
  console.log(`✅ Features: Permanent storage, Password validation, Security limits`);
  console.log(`🎯 Dashboard available at /dashboard.html`);
  console.log(`🐍 Python Monitor: POST /launch-monitor`);
});
