module.exports = function (app) {
  var Transaction = app.models.Transaction;
  var Budget = app.models.Budget;

  var bFindById = Budget.findById;
  Budget.findById = function (id, filter, cb) {

    var budgetObj;

    bFindById
      .call(Budget, id)
      .then(function (b) {

        budgetObj = b;
        return Transaction.find();
      })
      .then(function (transactions) {

        var expense = transactions.reduce(function (prevVal, currVal) {

          return prevVal + (currVal.Type === 'expense' ? currVal.Amount : 0);
        }, 0);

        budgetObj.Balance = budgetObj.SpendingLimit - expense;
        budgetObj.Expense = expense;

        cb(null, budgetObj);
      })
      .catch(cb)
  }

};
