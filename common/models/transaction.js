module.exports = function (Transaction) {
  function isAmountValid(err) {
    if (this.Amount < 0) err();
  }

  Transaction.validatesInclusionOf('Type', {in: ['income', 'expense']});
  Transaction.validate('Amount', isAmountValid, {message: 'Amount should be greater zero!'});
};
