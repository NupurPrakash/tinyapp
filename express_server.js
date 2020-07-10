const express = require("express");
const PORT = 8080;
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
//const { generateRandomString, findUserByEmail, validateUserId, urlsForUser, findUser } = require("./helpers");
const { findUserByEmail, generateRandomString } = require('./helpers');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use((req, res, next) => {
  req.currentUser = users[req.session["user_id"]];
  next();
});


app.set("view engine", "ejs");



//*********** URL Database*****************/

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

//************ users Database ************************/
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

//*********** to authenticate user's email and password *******/
const validateUserId = function(email, password) {
  const user = findUserByEmail(email, users);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user.id;
  } else {
    return false;
  }
};

/*********** to add new user to database ******************/
const addNewUser = (email, password) => {
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, saltRounds),
  };
  users[userId] = newUser;
  return userId;
};

//************* To return URL for the loggedin user *********************/
const urlsForUser = (id) => {
  const forUsers = {};
  for (const urls in urlDatabase) {

    if (urlDatabase[urls].userID === id) {
      forUsers[urls] = { longURL: urlDatabase[urls].longURL };
    }
  }
  return forUsers;
};

//********** Validating user from database *******************************/
const findUser = (userId) => {
  for (let user in users) {
    if (userId === user) {
      return users[user];
    }
  }
  return false;
};


//************* Get handler for the root ***************/

app.get("/", (req, res) => {
  res.send("Welcome to Tiny App!");
});

//************ Get handler for Register ***************/

app.get("/register", (req, res) => {
  if (req.session["user_id"]) {
    req.session["user_id"] = null;
  }
  res.render("register", {user: null});
});

//*********** Get handler for login *****************/
app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("login", templateVars);
});


//************* Post handler for register ****************/
app.post("/register", (req, res) => {
  const inputtedEmail = req.body.email;
  const inputtedPassword = req.body.password;
  //if no email and password
  if (inputtedEmail === "" || inputtedPassword === "") {
    res.status(400).send("Please enter valid credentials");
  }

  //if email already exists
  if (findUserByEmail(inputtedEmail, users)) {
    res.status(400).send("The user is already registered");
  } else {
    let newUserId = addNewUser(inputtedEmail, inputtedPassword);
    req.session["user_id"] = newUserId;
    res.redirect("/urls");
  }
  
});

//************* Post handler for login *********************/
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = validateUserId(email, password);

  //if no email and password
  if (email === "" || password === "") {
    res.status(400).send("Please enter your credentials");
  }
  if (userId) {
    req.session["user_id"] = userId;
    res.redirect("/urls");
  } else {
    res.status(403).send("No account registered for the email. Register first");
  }
 
});

//************ expiremental handlers ********************* */

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



//************ Get handler for /urls ********************/

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let userId = req.session["user_id"];
    // let userLogged = users[userId];
    //console.log(`sess: ${JSON.stringify(req.session)},${JSON.stringify(urlsForUser(req.session["user_id"]))}`)

    if (userId) {
      let templateVars = {
        urls: urlsForUser(userId),
        user : findUser(userId)
      };
      res.render("urls_index", templateVars);
    }
  } else {
    res.render("urls_index", { user: false });
  }
  
});

//*********** Get handler for /urls/new *****************/
app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  const userLogged = users[userId];

  if (userId) {
    let templateVars = { user: userLogged };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//************* Post handler for /urls *****************/
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID : req.session["user_id"] };
  res.redirect(`/urls/${shortURL}`);
  // console.log("Database:",urlDatabase);
  
});

//************* Get handler for /urls/:shortURL *****************/
app.get("/urls/:shortURL", (req, res) => {
 
  let userId = req.session["user_id"];
  let userLogged = users[userId];
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user : userLogged  };
  res.render("urls_show", templateVars);
 
});

//************* Post handler for /urls/:shortURL *****************/
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session["user_id"];
  const userUrls = urlsForUser(userId, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(401).send("You can't edit this url");
  }
});

//************* Get handler for /u/:shortURL *****************/
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.redirect(templateVars.longURL);
  } else {
    res.status(400).send("Enter a valid URL");
  }
});

//************* Post handler for /urls/:shortURL/delete *****************/
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session["user_id"];
  const userUrls = urlsForUser(userId, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls/");
  } else {
    res.status(401).send("You can't delete this url");
  }
});

//************* Post handler for /logout *****************/
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/urls");
});

//******************* Calling the server ********************* */
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT} !`);
});