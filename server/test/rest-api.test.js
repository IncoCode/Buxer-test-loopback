process.env.NODE_ENV = 'test';
var request = require('supertest');
var app = require('../server');
var assert = require('assert');
var User = require('./fixtures/MyUser.json');

var authUser;
var currencyId;
var account;

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

        authUser = data.body;

        done();
      });
  });

  it('should create new curency', function (done) {
    json('post', ['/api/Currencies/', '?access_token=', authUser.id].join(''))
      .send({
        Name: 'UAH'
      })
      .expect(200)
      .end(function (err, data) {
        assert(!!data.body.id);

        currencyId = data.body.id;

        done();
      });
  });

  it('should create new account for test user', function (done) {
    json('post', ['/api/MyUsers/', authUser.userId, '/accounts/?access_token=', authUser.id].join(''))
      .send({
        Name: 'Cash',
        currencyId: currencyId
      })
      .expect(200)
      .end(function (err, data) {
        assert(!!data.body.id);

        account = data.body;

        done();
      });
  });

});
