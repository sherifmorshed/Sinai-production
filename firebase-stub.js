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
    return{get:function(){bump('docReads',coll,1);return Promise.resolve(snapOf(path,false));},
      set:function(d,opt){var v=JSON.parse(JSON.stringify(d));
        /* merge:true must behave like Firestore's, or the merge-write test
           passes for the wrong reason: plain maps deep-merge key by key, and
           any other type (including an array) replaces wholesale. */
        STORE[path]=(opt&&opt.merge)?deepMerge(STORE[path]||{},v):v;
        bump('docWrites',coll,1);fire(path,true);return Promise.resolve();},
      update:function(d){STORE[path]=Object.assign({},STORE[path]||{},d);bump('docWrites',coll,1);fire(path,true);return Promise.resolve();},
      delete:function(){delete STORE[path];bump('docWrites',coll,1);fire(path,false);return Promise.resolve();},
      onSnapshot:function(cb){var l={path:path,cb:cb};listeners.push(l);bump('docReads',coll,1);
        setTimeout(function(){cb(snapOf(path,false));},10);
        return function(){listeners=listeners.filter(function(x){return x!==l;});};}};}
  function collRef(n){return{doc:function(id){return docRef(n+'/'+id);},
    get:function(){var d=Object.keys(STORE).filter(function(k){return k.indexOf(n+'/')===0;}).map(function(k){return{id:k.slice(n.length+1),exists:true,data:function(){return clone(STORE[k]);}};});
      bump('collReads',n,d.length||1);return Promise.resolve({size:d.length,empty:!d.length,docs:d,forEach:function(f){d.forEach(f);}});},
    onSnapshot:function(cb){setTimeout(function(){cb({size:0,empty:true,docs:[],forEach:function(){}});},10);return function(){};}};}
  var fsFn=function(){return{collection:collRef,enablePersistence:function(){return Promise.resolve();},
    batch:function(){var o=[];return{set:function(r,d){o.push(function(){return r.set(d);});return this;},update:function(r,d){o.push(function(){return r.update(d);});return this;},
      delete:function(r){o.push(function(){return r.delete();});return this;},commit:function(){return Promise.all(o.map(function(f){return f();}));}};}};};
  fsFn.FieldValue={serverTimestamp:function(){return {__ts:1,__v:Date.now()};},delete:function(){return null;}};
  var u=SEED.user||{email:'sherifmorshed@gmail.com',uid:'u1'};
  var a={currentUser:u,setPersistence:function(){return Promise.resolve();},onAuthStateChanged:function(cb){setTimeout(function(){cb(u);},50);return function(){};},
    signInWithEmailAndPassword:function(){return Promise.resolve({user:u});},signOut:function(){return Promise.resolve();}};
  var af=function(){return a;};af.Auth={Persistence:{LOCAL:'local'}};
  window.firebase={initializeApp:function(){return{};},firestore:fsFn,auth:af,apps:[{}]};
})();
