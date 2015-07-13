process.env.NODE_ENV = 'test';
var request = require('supertest');
var app = require('../server');
var assert = require('assert');
var Promise = require('bluebird');

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


  it('budget stat test (period: 01.07.2015 - 30.07.2015)', function (done) {
    json('get', ['/api/Budgets/getUserBudget?userId=', authUser.userId, '&startDate=2015-07-01T00:00:00.000Z&endDate=2015-07-30T23:59:59.000Z&access_token=', authUser.id]
      .join(''))
      .expect(200)
      .end(function (err, data) {
        var budgetStat = data.body.Budget;

        assert(!!budgetStat.id && budgetStat.Balance === 485 && budgetStat.Limit === 1000 && budgetStat.Expense === 515);

        done();
      });
  });

});
