const express = require("express");
const PORT = 8080;
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set("view engine", "ejs");


//********* Generating random string  for short url *********/
const generateRandomString = () => {
  let url = "";
  url += Math.random().toString(36).slice(2).slice(0, 6);
  return url;
};

//********** Validating user email ******************* */
const findUserByEmail = (email) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false; 
}

//********** Validating user's email and password **************/
const validateUser = (email, password) => {
  const user = findUserByEmail(email);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return false;
};


//************* To return URL for the loggedin user *********************/
const urlsForUser = (id, urlDatabase) => {
  const forUsers = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      forUsers[shortURL] = urlDatabase[shortURL];
    }
  }
  return forUsers;
};


/*
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
*/
const urlDatabase = { };
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", saltRounds)
  }
};

//************ Get handler for Register ***************/

app.get('/register', (req, res) => {
  const userId = req.cookies["userId"];
  if (userId) {
    res.redirect('/urls');
    return;
  } 
  let templateVars = { userId : users[userId] }  ;
  res.render('register', templateVars); 
});

//*********** Get handler for login *****************/
app.get('/login', (req, res) => {
  const userId = req.cookies["userId"];
  if (userId) {
    res.redirect('/urls');
    return;
  }
  let templateVars = { userId : users[userId] };
  res.render('login', templateVars);
});

//************* Post handler for register ****************/
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
    let newUserId = generateRandomString();
    console.log("userId", newUserId);
    users[newUserId] = { id : newUserId, email : req.body.email, password : bcrypt.hashSync(req.body.password, 10) };
    console.log("Obj",users);
    res.cookie('userId', newUserId);
    res.redirect('/urls');
  }
});

//************* Post handler for login *********************/
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = validateUser(email, password);
  if(!user) {
    res.status(401).send('Wrong Credentials! Please register to login');
  } else {
  res.cookie('userId', user);
  res.redirect('/urls');
  console.log("Users:",users);
  }

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

//************ Get handler for '/urls' ********************/

app.get("/urls", (req, res) => {
  let templateVars = {  urls: urlsForUser(req.cookies["userId"], urlDatabase), userId : req.cookies["userId"] };
  res.render("urls_index", templateVars);
});

//*********** Get handler for '/urls/new' *****************/
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["userId"]; 
  if(!userId) {
    res.redirect('/login');  //the page will  be accessed only after login
  } else {
    let templateVars = {  userId : req.cookies["userId"] };
    res.render("urls_new", templateVars);
  }
});

//************* Post handler for '/urls' *****************/
app.post("/urls", (req, res) => {
  const userId = req.cookies["userId"]; 
  if (userId) {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID : req.cookies["userId"] };
    res.redirect(`/urls/${shortURL}`);
    console.log("Database:",urlDatabase);
  } else {
    res.status(401).send('You must be logged in to see the urls');
  }
});

//************* Get handler for '/urls/:shortURL' *****************/
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userId : req.cookies["userId"]  };
  res.render("urls_show", templateVars);
});

//************* Post handler for '/urls/:shortURL' *****************/
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const userUrls = urlsForUser(userId, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) { 
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(400).send('You can\'t edit this url');
  }
});

//************* Get handler for '/u/:shortURL' *****************/
app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(templateVars.longURL);
});

//************* Post handler for '/urls/:shortURL/delete' *****************/
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const userUrls = urlsForUser(userId, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls/');
  } else {
    res.status(400).send('You can\'t delete this url');
  }
  
});

//************* Post handler for '/logout' *****************/
app.post('/logout', (req, res) => {
  res.clearCookie('userId', { path: "/"});
  res.redirect('/urls');
});

//******************* Calling the server ********************* */
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT} !`);
});