const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app={querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}};
let stored=JSON.stringify({phase:'intro',chapter:3}),two,three,four,disposed2=0,disposed3=0,disposed4=0;
const location={pathname:'/preview-v2.html',href:'https://example.test/preview-v2.html?chapter=2',search:'?chapter=2'};
const context=vm.createContext({document:{querySelector:()=>app},location,URL,URLSearchParams,
 history:{replaceState(a,b,url){location.href=String(url);location.search=new URL(url).search;}},
 sessionStorage:{getItem:()=>stored,setItem(k,v){stored=v;}},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},
 window:{addEventListener(){},startChapterTwo(options){two=options;return {dispose(){disposed2++;}};},startChapterThree(options){three=options;return {dispose(){disposed3++;}};},startChapterFour(options){four=options;return {dispose(){disposed4++;}};}}});
const run=s=>vm.runInContext(s,context);
run(fs.readFileSync(require.resolve('../firstperson.js'),'utf8').replace(/boot\(\);\s*$/,''));
run('boot()');assert.ok(two,'explicit Chapter 2 URL takes precedence over saved Chapter 3');
assert.equal(two.preview,true);two.onNext();assert.ok(three);assert.ok(disposed2>=1);assert.equal(new URL(location.href).searchParams.get('chapter'),'3');assert.equal(JSON.parse(stored).chapter,3);
three.onBack();assert.ok(disposed3>=1);assert.equal(new URL(location.href).searchParams.get('chapter'),'2');assert.equal(JSON.parse(stored).chapter,2);
two.onNext();three.onNext();assert.ok(four);assert.equal(new URL(location.href).searchParams.get('chapter'),'4');assert.equal(new URL(location.href).searchParams.has('room'),false);four.onBack();assert.ok(disposed4>=1);assert.equal(new URL(location.href).searchParams.get('chapter'),'3');
console.log('PASS: explicit chapter URL, persistent chapter selection, 2-to-3 continuation, 3-to-2 return and scene cleanup');
