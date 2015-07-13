process.env.NODE_ENV = 'test';
var request = require('supertest');
var app = require('../server');
var assert = require('assert');
var Promise = require('bluebird');
//var chai = require('chai');
//var assert = assert = chai.assert;
//var should = chai.should();
//var chaiAsPromised = require('chai-as-promised');
//chai.use(chaiAsPromised);

var User = require('./fixtures/MyUser.json');
var Transactions = require('./fixtures/Transactions.json');

var authUser;
var currencyId;
var account;
var budget;

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

  it('should create new currency', function (done) {
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

  it('should create several transactions', function (done) {
    Promise.map(Transactions, function (transaction) {
      return new Promise(function (resolve, reject) {
        json('post', ['/api/Accounts/', account.id, '/transactions/?access_token=', authUser.id].join(''))
          .send(transaction)
          .expect(200)
          .end(function (err, data) {
            if (!err && !!data.body.id) {
              resolve(data.body);
            }
            else {
              reject(err);
            }
          });
      })

    })
      .then(function (data) {
        done();
      })
      .catch(done);
  });

  it('should create new budget', function (done) {
    json('post', ['/api/MyUsers/', authUser.userId, '/Budgets/?access_token=', authUser.id].join(''))
      .send({
        SpendingLimit: 1000,
        Period: 'month'
      })
      .expect(200)
      .end(function (err, data) {
        assert(!!data.body.id);

        budget = data.body;

        done();
      });
  });

});
