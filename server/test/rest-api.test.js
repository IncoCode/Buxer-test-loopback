process.env.NODE_ENV = 'test';
var request = require('supertest');
var app = require('../server');
var assert = require('assert');
var User = require('./fixtures/MyUser.json');

//before(function importSampleData(done) {
//  this.timeout(50000);
//
//  done();
//});

function json(verb, url) {
  return request(app)[verb](url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/);
}

describe('MyUser', function () {
  it('should register new user', function (done) {
    json('post', '/api/MyUsers/')
      .send(User)
      .expect(200)
      .end(function (err, data) {
        assert(!!data.body.id);

        done();
      });
  });

  it('should sign in as test user', function (done) {
    json('post', '/api/MyUsers/login')
      .send({
        username: User.username,
        password: User.password
      })
      .expect(200)
      .end(function (err, data) {
        assert(!!data.body.userId);

        done();
      });
  });

});
