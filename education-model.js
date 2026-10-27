(function(root){
  'use strict';
  const key='project-b0-education-v1';
  const fresh=()=>({version:1,watched:false,workingSeen:false,first:'',middle:'',answer:'',verified:false,memoryTaken:false,help:{},attempts:0});
  function restore(raw){const s=fresh();if(raw?.version!==1)return s;for(const k of ['watched','workingSeen','verified'])s[k]=raw[k]===true;for(const k of ['first','middle','answer'])s[k]=String(raw[k]||'').slice(0,12);s.memoryTaken=s.verified&&raw.memoryTaken===true;s.help={...raw.help};s.attempts=Math.max(0,Number(raw.attempts)||0);return s;}
  function check(s){s.attempts++;if(!s.workingSeen)return '먼저 영상 속 풀이를 확인해 보자.';if(s.first!=='divide')return '먼저 고른 계산이 영상 속 풀이와 같아. 괄호 없는 곱셈·나눗셈의 계산 순서를 다시 확인해 보자.';if(Number(s.middle)!==8||s.middle.trim()==='')return '첫 번째 계산 결과를 다시 확인해 보자.';if(Number(s.answer)!==16||s.answer.trim()==='')return '첫 결과 다음에 남아 있는 연산을 확인해 보자.';s.verified=true;return '수정한 풀이를 처음 식에 다시 적용했습니다. 두 계산의 순서와 결과가 일치합니다. 기록 복구가 완료되었습니다.';}
  function take(s){if(!s.verified||s.memoryTaken)return false;s.memoryTaken=true;return true;}
  function read(storage){try{return restore(JSON.parse(storage.getItem(key)));}catch{return fresh();}}
  const api={key,fresh,restore,check,take,read};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0Education=api;
})(typeof window!=='undefined'?window:globalThis);
