// server.js

const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(express.json());
const cors = require("cors");
app.use(cors());


const connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"test",
    connectionLimit:10
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database as ID ' + connection.threadId);
});

const jwt = require('jsonwebtoken');
const secretKey="djsufebeknkcjcj";



app.post('/update-time', (req, res) => {
    const { date, domain } = req.body;
    let time = 0;
  
    connection.query('SELECT time FROM db WHERE date = ? AND domain = ?', [date, domain], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      if (results.length > 0) {
        time = results[0].time + 1;
        connection.query('UPDATE db SET time = ? WHERE date = ? AND domain = ?', [time, date, domain], (error) => {
          if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          const times={};
          times[domain]=time;
          res.json(times);
        });
      } else {
        time = 1;
        connection.query('INSERT INTO db (date, domain, time) VALUES (?, ?, ?)', [date, domain, time], (error) => {
          if (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          const times={};
          times[domain]=time;
          res.json(times);
        });
      }
    });
  });
  
  

// // Add this endpoint in your server.js
app.get('/fetch-data', (req, res) => {
    const { date } = req.query;
   
    connection.query(   
      'SELECT domain, time,info FROM db WHERE date = ?',
      [date],
      (error, results, fields) => {
        if (error) {
          console.error('Error fetching data: ' + error);
          res.sendStatus(500);
        } else {
          const storedItems = {};
          results.forEach(row => {
            storedItems[row.domain] = {time:row.time,status:row.info}
          });
          // console.log(storedItems);
          res.json(storedItems);
        }
      }
    );
  });

  app.get("/blocked-websites",(req,res)=>{
    const {date1}=req.query;
    connection.query(
      'SELECT domain FROM db WHERE status = "Block" and date=?',
      [date1],
      (error,results,fields)=>{
        if(error){
          res.status(500).send('Error querying the database');
          return;
        }
        const blockedWebsites = results.map(row => row.domain);
    
    res.json(blockedWebsites);
      }
    )
});


// // // Add this endpoint in your server.js
app.get('/fetch-dates', (req, res) => {
    connection.query(
      'SELECT DISTINCT date FROM db',
      (error, results, fields) => {
        if (error) {
          console.error('Error fetching dates: ' + error);
          res.sendStatus(500);
        } else {
          const datesStored = results.map(row => row.date);
          res.json(datesStored);
        }
      }
    );
  });
  // Add this endpoint in your server.js
  app.get('/fetch-data-for-date', (req, res) => {

    const { date } = req.query;
    
    connection.query(
      'SELECT domain, time FROM db WHERE date = ?',
      [date],
      (error, results, fields) => {
        if (error) {
          console.error('Error fetching data for the given date: ' + error);
          res.sendStatus(500);
        } else {
          const thatDay = {};
          results.forEach(row => {
            thatDay[row.domain] = row.time;
          });
          res.json(thatDay); // Return just the object, not wrapped in another object with the date as key
        }
      }
    );
  });
  
  app.get('/fetch-weekly-data', (req, res) => {
    connection.query(
      'SELECT date, domain, time FROM db WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
      (error, results, fields) => {
        if (error) {
          console.error('Error fetching weekly data: ' + error);
          res.sendStatus(500);
        } else {
          const weeklyData = {};
          results.forEach(row => {
            if (!weeklyData[row.date]) {
              weeklyData[row.date] = {};
            }
            weeklyData[row.date][row.domain] = row.time;
          });
          res.json(weeklyData);
        }
      }
    );
  });
  
  app.post("/update-registration", (req, res) => {
    const { webURL, info } = req.body;
    connection.query(
      "UPDATE db SET info = ? ,status = ? WHERE domain = ?",
      [info , info, webURL],
      (error, results, fields) => {
        if (error) {
          console.error("Error updating registration:", error);
          res.status(500).send("Error updating registration");
          return;
        }
        res.sendStatus(200);
      }
    );
  });




  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    connection.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username , password],
      (error, results, fields) => {
      if (error) {
        console.error('Error executing query:', error.stack);
        res.status(500).json({ success: false, message: 'Internal server error' });
        return;
      }
  
      if (results.length > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Invalid credentials' });
      }
    });
  });


  let loggedIn = false;

// Endpoint to check if the user is logged in
app.get('/check-login', (req, res) => {
  res.json({ loggedIn });
});


app.post('/sign-out', (req, res) => {
  loggedIn = false;
  res.json({ success: true, message: 'User signed out successfully' });
});

  // app.get('/blocked-websites', (req, res) => {
  //   let sql = 'SELECT domain FROM db WHERE status = "Block"';
    
  //   db.query(sql, (err, results) => {
  //     if (err) {
  //       res.status(500).send('Error querying the database');
  //       return;
  //     }
  //     const blockedWebsites = results.map(row => row.domain);
  //     console.log(blockedWebsites);
  //     res.json(blockedWebsites);
  //   });
  // });

  

  
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
