module.exports = function (app) {
  var Promise = require('bluebird');
  var _ = require('underscore');

  var Transaction = app.models.Transaction;
  var Account = app.models.Account;
  var Budget = app.models.Budget;

  Budget.getUserBudget = function (userId, startDate, endDate, cb) {
    if (!userId || !startDate || !endDate)
      cb("Wrong params!");

    var budget;
    var startDateObj = new Date(startDate);
    var endDateObj = new Date(endDate);

    Budget
      .findOne({where: {myUserId: userId}})
      .then(function (b) {
        if (!b)
          return Promise.reject("User not found or Budget for this user has not been created!");

        budget = b;
        budget.Limit = Budget.getLimitForPeriod(budget, daysBetween(startDateObj, endDateObj));

        return Account.find({
          include: 'transactions',
          where: {
            myUserId: budget.myUserId
          }
        })
      })
      .then(function (accounts) {
        return Promise.map(accounts, function (acc) {
          return Transaction
            .find({
              where: {
                and: [
                  {Date: {gte: startDateObj}},
                  {Date: {lte: endDateObj}}
                ],
                accountId: acc.id
              }
            })
        });
      })
      .then(function (transactionsArr) {
        var transactions = _.flatten(transactionsArr);

        var expense = transactions.reduce(function (prevVal, currVal) {
          return prevVal + (currVal.Type === 'expense' ? currVal.Amount : 0);
        }, 0);

        budget.Balance = (budget.Limit - expense).toFixed(2);
        budget.Expense = expense;

        cb(null, budget);
      })
      .catch(cb)
  };
  Budget.remoteMethod(
    'getUserBudget',
    {
      accepts: [{arg: 'userId', type: 'string'}, {arg: 'startDate', type: 'string'}, {arg: 'endDate', type: 'string'}],
      returns: {arg: 'Budget', type: 'object'},
      http: {path: '/getUserBudget', verb: 'get'}
    }
  );

  function daysBetween(date1, date2) {
    // get 1 day in milliseconds
    var one_day = 1000 * 60 * 60 * 24;

    // convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();

    // calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;

    // convert back to days and return
    return Math.round(difference_ms / one_day);
  }

};
