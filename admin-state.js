// admin-state.js — read settings from the Admin Console (admin.html)
// The admin panel writes to localStorage key `admin_state_v1`.
// Pages read from here so admin changes propagate without page-by-page edits.
(function(){
  const STORE_KEY = 'admin_state_v1';

  function load(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch(e){ return {}; }
  }

  window.AdminState = {
    // get('eval.alb-threshold', 15) → returns saved value or fallback
    get(id, fallback) {
      const s = load();
      return (id in s) ? s[id] : fallback;
    },
    // true if user has customised a setting
    has(id) { return id in load(); },
    // listen for cross-tab admin changes
    onChange(cb) {
      window.addEventListener('storage', e => {
        if (e.key === STORE_KEY) cb();
      });
    }
  };

  // tierFor(value) → the AMC value tier (approval authority) for a rupee amount.
  window.AdminState.tierFor = function(valueInRupees) {
    const tiers = AdminState.get('tiers.def', [
      {min:0, max:500000, auth:'HOD'},
      {min:500000, max:2500000, auth:'Deputy Commissioner'},
      {min:2500000, max:5000000, auth:'Commissioner'},
      {min:5000000, max:null, auth:'State Government'},
    ]);
    return tiers.find(t => valueInRupees >= t.min && (t.max == null || valueInRupees < t.max));
  };

  // officers() → the AMC officer directory used for approval chains.
  window.AdminState.officers = function() {
    return AdminState.get('officers.directory', [
      {name:'Rajesh Kumar', role:'Super Admin',         email:'rajesh.kumar@amc.gov.in', dept:'Procurement',        status:'Active'},
      {name:'Priya Shah',   role:'Technical Officer',   email:'priya.shah@amc.gov.in',   dept:'Engineering',        status:'Active'},
      {name:'Amit Patil',   role:'Finance Officer',     email:'amit.patil@amc.gov.in',   dept:'Finance',            status:'Active'},
      {name:'Sunita Rao',   role:'Deputy Commissioner', email:'sunita.rao@amc.gov.in',   dept:'Commissioner Office', status:'Active'},
      {name:'Ravi Mehta',   role:'Accounts Officer',    email:'ravi.mehta@amc.gov.in',   dept:'Accounts',           status:'Active'},
    ]);
  };
})();
