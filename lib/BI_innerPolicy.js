/*******************
Note

policy about network, not used in now
since vpn
but remain for other purpose

*******************/


class innerPolicy{

  /*******************
  *create innerPolicy object
  *data composition
  *number : innerPolicy index, automatically generate
  *policyType : 1: add_node , 2: delete_node , 3 : update_policy
  *action : allow or deny
  *@constructor innerPolicy
  ********************/
  constructor(data){
     this.number = data.number;
     this.policyType = data.policyType;
     this.action = data.action;
  }

}

module.exports = innerPolicy
