const { assert } = require('chai');

const { findUserByEmail, generateRandomString} = require('../helpers.js');

const testUsers = {
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

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user.id, expectedOutput);
  });
  it('should return undefined with invalid email', function() {
    const user = findUserByEmail("test@test.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user.id, expectedOutput);
  });

});

describe("generateRandomString", function() {
  it("should return a string with 6 characters", function() {
    const stringLength = generateRandomString().length;
    const expectedOutput = 6;
    assert.equal(stringLength, expectedOutput);
  });

});