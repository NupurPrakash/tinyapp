const express = require("express");
const PORT = 8080;
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.set("view engine", "ejs");

function generateRandomString() {
  let url = "";
  url += Math.random().toString(36).slice(2).slice(0, 6);
  return url;
  }

  function findUserByEmail(email) {
    for (let userId in users) {
      if (users[userId].email === email) {
        return users[userId];
      }
    }
    return false;
    
  }


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//Registering user

app.get('/register', (req, res) => {
  const userId = req.cookies["userId"];
  if (userId) {
    res.redirect('/urls');
    return;
  } 
  //const userObj = users[userId];
  let templateVars = { userId : users[userId] }  ;
  res.render('register', templateVars);
  
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //if no email and password
  if (email === '' || password === '') {
    res.status(400).send('Error: Input email id and password');
  }
  //if email already exists
  const user = findUserByEmail(email);
  if(user) {
    res.status(401).send('Error! Email already exists');
  } else {

    let userId = generateRandomString();
    console.log("userId", userId);
    users[userId] = { id : userId, email : req.body.email, password : req.body.password};
    console.log("Obj",users);
    res.cookie('userId', userId);
    res.redirect('/urls');
  }
  

});




app.post("/login", (req, res) => {
  //extract user info from req body
  //does the user with that email exist
  //check email and password match
  //set user id in the cookie
  //res.redirect
  res.cookie('userId', req.body.username);
  res.redirect('/urls');

});

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.get("/urls", (req, res) => {
  //let templateVars = { urls: urlDatabase };
  let templateVars = {  urls: urlDatabase, userId : req.cookies["userId"] }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {  userId : req.cookies["userId"] }

  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL
  //res.send("Responding with a redirect");
  res.redirect(`/urls/${shortURL}`);
});


app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userId : req.cookies["userId"]  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
 // urlDatabase[req.params.shortURL].longURL = req.body.longURL;
urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(templateVars.longURL);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls/');
});

app.post('/logout', (req, res) => {
  res.clearCookie('userId', { path: "/"});
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT} !`);
});