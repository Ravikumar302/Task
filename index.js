const express = require('express');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const bcrypt = require("bcrypt") 
const jwt = require('jsonwebtoken');
const authenticateToken = require('./auth')

const app = express();
const port = 4000;


// Parse the requests of content-type 'application/json'
app.use(bodyParser.json());

// Create the MySQL connection pool
const  db = mysql2.createConnection({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Ravi@1234',
    database: 'task'
});

db.connect((err) => {
  if(err) {
    console.error('Database connection error:', err);
    throw err;
  }
  console.log('Connected to MySQL database');
});

module.exports = db;


let secretkey = '6382';

//Register User API

app.post("/register", (req,res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hash], (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).json({ error: 'Registration failed' });
          } 
          else {
            res.status(201).json({ message: 'Registration successful' });
          }
        });
      }
    });
})



//Login User API

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
    } else {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          res.status(500).json({ error: 'Internal server error' });
        } else if (!match) {
          res.status(401).json({ error: 'Invalid credentials' });
        } else {
          // Generate JWT token
          const token = jwt.sign({ userId: user.id, username: user.username }, secretkey , { expiresIn: '24h' });
          res.status(200).json({ token });
        }
      });
    }
  });
});


//CRUD operation

//Get a Product Record
app.get('/products', authenticateToken, (req, res) => {
    db.query('SELECT * FROM product', (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving products');
        } else {
            res.status(200).json(results);
        }
    });
})

//Post a product Record
app.post('/products', authenticateToken, (req, res) => {
    const { Name, Description, Price, Product_type } = req.body;
    db.query('INSERT INTO product SET ?', { Name , Description, Price, Product_type }, (err, result) => {
        if (err) {
            console.error('Error creating record: ', err);
            res.status(500).send('Error creating record');
            return;
        }

        res.send(result);
    });
});

// Update an existing record
app.put('/products/:id', authenticateToken, (req, res) => {
    const product_id = req.params.id;
    const { Name, Description, Price, Product_type } = req.body;
    db.query('UPDATE product SET Name= ?, Description= ?, Price= ?, Product_type= ?  WHERE product_id = ?',[Name, Description, Price, Product_type,product_id], (err, result) => {
        if (err) {
            console.error('Error updating record: ', err);
            res.status(500).send('Error updating record');
            return;
        }
        res.send(result);
    });
});

// Delete a record
app.delete('/products/:id', authenticateToken , (req, res) => {
    const product_id = req.params.id;

    db.query('DELETE FROM product WHERE product_id = ?', product_id, (err, result) => {
        if (err) {
            console.error('Error deleting record: ', err);
            res.status(500).send('Error deleting record');
            return;
        }

        res.send(result);
    });
});




// Start a server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
