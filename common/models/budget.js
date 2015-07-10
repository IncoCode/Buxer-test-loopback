module.exports = function (Budget) {
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

  function isSpendingLimitValid(err) {
    if (this.SpendingLimit < 0) {
      err();
    }
  }

  Budget.validatesInclusionOf('Period', {in: ['week', 'month', 'year']});
  Budget.validate('SpendingLimit', isSpendingLimitValid, {message: 'SpendingLimit should be greater zero!'});

};
