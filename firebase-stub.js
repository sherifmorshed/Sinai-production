(function(){
  function isPlainMap(x){ return x&&typeof x==='object'&&!Array.isArray(x); }
  function deepMerge(base,patch){
    if(!isPlainMap(base)||!isPlainMap(patch)) return patch;
    var out=JSON.parse(JSON.stringify(base));
    Object.keys(patch).forEach(function(k){
      out[k]=(isPlainMap(patch[k])&&isPlainMap(out[k]))?deepMerge(out[k],patch[k]):patch[k];
    });
    return out;
  }
  var SEED=window.__SEED__||{}; var STORE=SEED.store||{}; var listeners=[];
  window.__STUB__={store:STORE, setUser:function(email){ SEED.user={email:email,uid:'x'}; a.currentUser=SEED.user; }};
  function clone(o){var c=JSON.parse(JSON.stringify(o));
    if(c&&c.updatedAt&&c.updatedAt.__ts!==undefined){var _v=c.updatedAt.__v||1754000000000;c.updatedAt={toMillis:function(){return _v;}};}return c;}
  function pend(o){var c=JSON.parse(JSON.stringify(o)); if(c)c.updatedAt=null; return c;}
  window.__IO__={docReads:0,collReads:0,docWrites:0,byColl:{},denied:[]};
  function bump(k,c,n){window.__IO__[k]+=n;window.__IO__.byColl[c]=window.__IO__.byColl[c]||{reads:0,writes:0};
    if(k==='docWrites')window.__IO__.byColl[c].writes+=n;else window.__IO__.byColl[c].reads+=n;}
  function snapOf(p,pn){return{exists:STORE[p]!==undefined,id:p.split('/').pop(),
    data:function(){return pn?pend(STORE[p]||{}):clone(STORE[p]||{});},metadata:{hasPendingWrites:!!pn,fromCache:false}};}
  function fire(p,lw){var ls=listeners.filter(function(l){return l.path===p;});
    if(lw){ls.forEach(function(l){l.cb(snapOf(p,true));});setTimeout(function(){ls.forEach(function(l){l.cb(snapOf(p,false));});},60);}
    else ls.forEach(function(l){l.cb(snapOf(p,false));});}
  function docRef(path){var coll=path.split('/')[0];
    function merged(d,opt){var v=JSON.parse(JSON.stringify(d));
      return (opt&&opt.merge)?deepMerge(STORE[path]||{},v):v;}
    return{get:function(){
        if(!docAllowed(path,'read',STORE[path],null)) return Promise.reject(deny(coll,'get '+path));
        bump('docReads',coll,1);return Promise.resolve(snapOf(path,false));},
      set:function(d,opt){
        /* merge:true must behave like Firestore's, or the merge-write test
           passes for the wrong reason: plain maps deep-merge key by key, and
           any other type (including an array) replaces wholesale. */
        var next=merged(d,opt);
        if(!docAllowed(path,'write',STORE[path],next)) return Promise.reject(deny(coll,'set '+path));
        STORE[path]=next;
        bump('docWrites',coll,1);fire(path,true);return Promise.resolve();},
      update:function(d){var next=Object.assign({},STORE[path]||{},d);
        if(!docAllowed(path,'write',STORE[path],next)) return Promise.reject(deny(coll,'update '+path));
        STORE[path]=next;bump('docWrites',coll,1);fire(path,true);return Promise.resolve();},
      delete:function(){delete STORE[path];bump('docWrites',coll,1);fire(path,false);return Promise.resolve();},
      onSnapshot:function(cb,errCb){
        if(!docAllowed(path,'read',STORE[path],null)){
          var e=deny(coll,'listen '+path); setTimeout(function(){ if(errCb) errCb(e); },10);
          return function(){};
        }
        var l={path:path,cb:cb};listeners.push(l);bump('docReads',coll,1);
        setTimeout(function(){cb(snapOf(path,false));},10);
        return function(){listeners=listeners.filter(function(x){return x!==l;});};}};}
  /* firestore.rules, simulated — enough of it that a test proving "this
     account cannot see that" proves something. Without it the stub answers
     every read happily; the real server is what refuses, so the stub has to
     refuse too.

     Firestore rejects a QUERY it cannot prove is safe rather than trimming the
     result, so an operator asking for all of tbReadings is refused outright even
     though some documents are his. Keep these maps matching TB_ACCOUNTS and the
     role lists in index.html and the functions in firestore.rules. */
  var TB_MAP={'tb10-1@petrobel.org':'tb10_1','tb6-1@petrobel.org':'tb6_1',
              'tb6-2@petrobel.org':'tb6_2','tb8-1@petrobel.org':'tb8_1',
              'tb8-2@petrobel.org':'tb8_2'};
  var ADMINS=['sherifmorshed@gmail.com'], PLANT=['rasgara@petrobel.org'],
      PETRECO=['petreco@petrobel.org'];
  function who(){ return String((SEED.user&&SEED.user.email)||'').toLowerCase(); }
  function isAdmin(){ return ADMINS.indexOf(who())!==-1; }
  function isOperator(){ return isAdmin()||PLANT.indexOf(who())!==-1||PETRECO.indexOf(who())!==-1; }
  function isPetreco(){ return PETRECO.indexOf(who())!==-1; }
  function mine(){ return TB_MAP[who()]||''; }
  function deny(coll,what){
    window.__IO__.denied.push({coll:coll,what:what,code:'permission-denied'});
    var e=new Error('Missing or insufficient permissions.'); e.code='permission-denied'; return e;
  }
  // op: 'read' | 'write'. existing / incoming: document data, for tbReadings.
  function docAllowed(path,op,existing,incoming){
    var c=path.split('/')[0];
    if(c==='rasGara'||c==='rasGaraMeta') return isOperator();
    if(c==='pfReadings'||c==='pfReadingsMeta') return isAdmin()||isPetreco();
    if(c==='tbReadingsMeta') return isAdmin()||!!mine();
    if(c==='tbReadings'){
      if(isAdmin()) return true;
      if(!mine()) return false;
      if(op==='read') return !existing || existing.battery===mine();
      var ok=(incoming&&incoming.battery===mine());
      return existing ? (existing.battery===mine() && ok) : ok;
    }
    return false;
  }
  function denyReason(n,filters){
    if(n!=='tbReadings') return docAllowed(n+'/x','read',null,null) ? null : 'permission-denied';
    if(isAdmin()) return null;                            // admin reads all
    if(!mine()) return 'permission-denied';               // not a battery account
    var f=null; filters.forEach(function(x){ if(x.field==='battery') f=x; });
    if(!f) return 'permission-denied';                    // unfiltered: refused
    if(f.value!==mine()) return 'permission-denied';      // someone else's battery
    return null;
  }
  function collRef(n){
    function build(filters){
      function run(){
        var why=denyReason(n,filters);
        if(why){ window.__IO__.denied.push({coll:n,filters:filters,code:why});
                 var e=new Error('Missing or insufficient permissions.'); e.code=why;
                 return Promise.reject(e); }
        var d=Object.keys(STORE).filter(function(k){return k.indexOf(n+'/')===0;})
          .map(function(k){return{id:k.slice(n.length+1),exists:true,data:function(){return clone(STORE[k]);}};})
          .filter(function(doc){var v=doc.data();
            return filters.every(function(f){return v[f.field]===f.value;});});
        bump('collReads',n,d.length||1);
        return Promise.resolve({size:d.length,empty:!d.length,docs:d,forEach:function(f){d.forEach(f);}});
      }
      return {doc:function(id){return docRef(n+'/'+id);},
        where:function(field,op,value){return build(filters.concat([{field:field,op:op,value:value}]));},
        get:run,
        onSnapshot:function(cb){setTimeout(function(){cb({size:0,empty:true,docs:[],forEach:function(){}});},10);return function(){};}};
    }
    return build([]);
  }
  var fsFn=function(){return{collection:collRef,enablePersistence:function(){return Promise.resolve();},
    batch:function(){var o=[];return{set:function(r,d,opt){o.push(function(){return r.set(d,opt);});return this;},update:function(r,d){o.push(function(){return r.update(d);});return this;},
      delete:function(r){o.push(function(){return r.delete();});return this;},commit:function(){return Promise.all(o.map(function(f){return f();}));}};}};};
  fsFn.FieldValue={serverTimestamp:function(){return {__ts:1,__v:Date.now()};},delete:function(){return null;}};
  var u=SEED.user||{email:'sherifmorshed@gmail.com',uid:'u1'}; SEED.user=u;
  var a={currentUser:u,setPersistence:function(){return Promise.resolve();},onAuthStateChanged:function(cb){setTimeout(function(){cb(u);},50);return function(){};},
    signInWithEmailAndPassword:function(){return Promise.resolve({user:u});},signOut:function(){return Promise.resolve();}};
  var af=function(){return a;};af.Auth={Persistence:{LOCAL:'local'}};
  window.firebase={initializeApp:function(){return{};},firestore:fsFn,auth:af,apps:[{}]};
})();
