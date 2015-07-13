module.exports = function (app) {

  var Budget = app.models.Budget;
  var MyRole = app.models.MyRole;

  Budget.remoteMethod(
    'getUserBudget',
    {
      accepts: [{arg: 'startDate', type: 'string'}, {arg: 'endDate', type: 'string'}],
      returns: {arg: 'Budget', type: 'object'},
      http: {path: '/getUserBudget', verb: 'get'}
    }
  );

  // creates admin role
  MyRole
    .findOne({where: {name: 'admin'}})
    .then(function (role) {
      if (!role) {
        MyRole.create({name: 'admin'});
      }
    });

};
