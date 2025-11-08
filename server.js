const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();

// 🚨 CLOUD-OPTIMIZED FILE PATHS 🚨
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGIN_ATTEMPTS_FILE = path.join(DATA_DIR, 'login_attempts.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory:', DATA_DIR);
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
app.use(express.static(__dirname)); // 🎯 FIXED: Serve from root directory

// Serve all HTML files directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/monitor', (req, res) => {
  res.sendFile(path.join(__dirname, 'monitor.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Ghost Auth is running smoothly!',
    timestamp: new Date().toISOString(),
    users: users.length
  });
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

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores' 
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false,
        message: passwordValidation.message 
      });
    }

    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({ 
        success: false,
        message: `User with this ${field} already exists` 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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
    saveUsers();

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'ghost-secret-key',
      { expiresIn: '24h' }
    );

    const session = {
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    sessions.push(session);
    saveSessions();

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Redirecting to dashboard...',
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      redirect: '/dashboard.html'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Enhanced Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    if (loginAttempts[username] >= 5) {
      return res.status(429).json({ 
        success: false,
        message: 'Too many failed attempts. Please try again in 15 minutes.' 
      });
    }

    const user = users.find(u => u.email === username || u.username === username);
    
    if (!user) {
      loginAttempts[username] = (loginAttempts[username] || 0) + 1;
      saveLoginAttempts();
      
      return res.status(400).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    if (!user.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      loginAttempts[username] = (loginAttempts[username] || 0) + 1;
      saveLoginAttempts();
      
      const attemptsLeft = 5 - loginAttempts[username];
      return res.status(400).json({ 
        success: false,
        message: `Invalid username or password. ${attemptsLeft > 0 ? attemptsLeft + ' attempts left' : 'No attempts left'}` 
      });
    }

    delete loginAttempts[username];
    saveLoginAttempts();

    user.lastLogin = new Date();
    saveUsers();

    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'ghost-secret-key',
      { expiresIn: tokenExpiry }
    );

    const session = {
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
    };
    sessions.push(session);
    saveSessions();

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
      redirect: '/dashboard.html'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Other routes remain the same...
app.post('/api/logout', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    sessions = sessions.filter(s => s.token !== token);
    saveSessions();
  }
  
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

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

app.post('/api/reset-attempts', (req, res) => {
  const { username } = req.body;
  if (username) {
    delete loginAttempts[username];
    saveLoginAttempts();
  }
  res.json({ message: 'Login attempts reset' });
});

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
        
        const pythonScriptPath = path.join(__dirname, 'real_monitor.py');
        
        const pythonProcess = spawn('python', [pythonScriptPath], {
            detached: true,
            stdio: 'ignore',
            cwd: __dirname
        });
        
        pythonProcess.unref();
        
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

// 🚀 START SERVER - OPTIMIZED FOR RENDER 🚀
// 🚀 WINDOWS-STYLE STARTUP
console.log("Microsoft Windows [Version 10.0.26200.7019]");
console.log("(c) Microsoft Corporation. All rights reserved.\n");
console.log(`D:\\ghost-auth>node server.js`);
console.log(`Starting Ghost Auth Server...`);
console.log(`Port: ${process.env.PORT || 5000}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Users: ${users.length}`);
console.log(`Server ready for connections...\n`);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  // Server is running silently
});