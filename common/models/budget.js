module.exports = function (Budget) {

  var Promise = require('bluebird');
  var _ = require('underscore');
  var loopback = require('loopback');

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

  function isSpendingLimitValid(err) {
    if (this.SpendingLimit < 0) {
      err();
    }
  }

  Budget.validatesInclusionOf('Period', {in: ['week', 'month', 'year']});
  Budget.validate('SpendingLimit', isSpendingLimitValid, {message: 'SpendingLimit should be greater zero!'});

  Budget.getLimitForPeriod = function (budgetObj, daysPeriod) {
    var dayStep = 0;
    switch (budgetObj.Period) {
      case 'week':
        dayStep = budgetObj.SpendingLimit / 7;
        break;

      case 'month':
        dayStep = budgetObj.SpendingLimit / 30;
        break;

      case 'year':
        dayStep = budgetObj.SpendingLimit / 360;
        break;
    }
    return (dayStep * daysPeriod).toFixed(2);
  };

  Budget.getUserBudget = function (startDate, endDate, cb) {
    if (!startDate || !endDate)
      cb("Wrong params!");

    var Transaction = Budget.app.models.Transaction;
    var Account = Budget.app.models.Account;

    var budget;
    var startDateObj = new Date(startDate);
    var endDateObj = new Date(endDate);

    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');

    Budget
      .findOne({where: {myUserId: currentUser.id}})
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

};
