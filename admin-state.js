// admin-state.js — read settings from the Admin Console (admin.html)
// The admin panel writes to localStorage key `admin_state_v1`.
// Pages read from here so admin changes propagate without page-by-page edits.
(function(){
  const STORE_KEY = 'admin_state_v1';

  function load(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch(e){ return {}; }
  }

  // Alias map — old setting ids that were merged into richer items in the
  // Admin Console. A portal page still asking for an old id transparently gets
  // the equivalent slice of the new merged item, so nothing breaks.
  const ALIASES = {
    // resolved against 'tender.methods-suite' (Evaluation methods & procurement modes)
    'tender.method-master':        m => m && m.methods,
    'tender.qcbs-ratios':          m => { const q = m && Array.isArray(m.methods) && m.methods.find(x => x.id === 'qcbs'); return q ? (q.allowedRatios || q.ratios) : undefined; },
    // merged into 'tender.notifications-suite' (Notifications, reminders & escalation)
    'tender.reminder-schedule':       n => n && n.events && n.events.map(e => ({k:e.name, v:e.reminders||''})),
    'tender.notification-channels':   n => n,
    'tender.notification-recipients': n => n,
    'tender.escalation-rules':        n => n && n.events && n.events.filter(e=>e.escalation).map(e=>({event:e.name, breachHours:e.escalation.breachHours, escalateTo:e.escalation.escalateTo})),
    // absorbed into 'tender.tq-rubric' (sector overrides tab)
    'eval.tq-sector-overrides':          r => r && r.overrides,
  };
  const ALIAS_PARENT = {
    'tender.method-master':'tender.methods-suite','tender.qcbs-ratios':'tender.methods-suite',
    'tender.reminder-schedule':'tender.notifications-suite','tender.notification-channels':'tender.notifications-suite','tender.notification-recipients':'tender.notifications-suite','tender.escalation-rules':'tender.notifications-suite',
    'eval.tq-sector-overrides':'tender.tq-rubric',
  };

  window.AdminState = {
    // get('eval.alb-threshold', 15) → returns saved value or fallback
    get(id, fallback) {
      const s = load();
      if (id in s) return s[id];
      // Resolve a retired id through the merged item it now lives in.
      if (ALIASES[id]) {
        const parent = s[ALIAS_PARENT[id]];
        if (parent !== undefined) {
          const v = ALIASES[id](parent);
          if (v !== undefined && v !== null) return v;
        }
      }
      return fallback;
    },
    // true if user has customised a setting (directly, or via its merged parent)
    has(id) {
      const s = load();
      if (id in s) return true;
      return !!(ALIAS_PARENT[id] && (ALIAS_PARENT[id] in s));
    },
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

  // logo(tag) → the data URL of the DEFAULT image asset for a usage tag
  // ('Header logo' | 'Official seal' | 'Watermark' | 'Footer emblem'), or null.
  // logoAsset(tag) → the full asset object {id,name,tag,isDefault,image:{dataUrl,width,height,size,type,name}}.
  window.AdminState.logoAsset = function(tag) {
    const lib = AdminState.get('sig.logos', []);
    if (!Array.isArray(lib)) return null;
    return lib.find(a => a && a.tag === tag && a.isDefault) ||
           lib.find(a => a && a.tag === tag) || null;
  };
  window.AdminState.logo = function(tag) {
    const a = AdminState.logoAsset(tag);
    return (a && a.image && a.image.dataUrl) || null;
  };
})();
