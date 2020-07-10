//********** to return registered user ******************* */
const findUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

//********* Generating random string  for short url *********/
const generateRandomString = () => {
  let url = "";
  url += Math.random().toString(36).slice(2).slice(0, 6);
  return url;
};



module.exports = { findUserByEmail, generateRandomString  };