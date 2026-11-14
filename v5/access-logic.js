(function(root){
  'use strict';
  const clues=['비밀번호는 서로 다른 1~9의 숫자 세 개입니다.','첫째 숫자는 셋째 숫자의 2배입니다.','둘째 숫자와 셋째 숫자의 합은 7입니다.','첫째 숫자와 둘째 숫자의 합은 9입니다.'];
  const digits=[1,2,3,4,5,6,7,8,9];
  const fresh=()=>({version:1,step:'first',a:null,b:null,c:null,message:'첫째 숫자는 무엇일 것 같나요? 하나 골라 함께 확인해 봐요.',history:[]});
  function check(code){
    if(!/^[1-9]{3}$/.test(String(code)))return {ok:false,reason:'1~9의 숫자 세 개를 눌러 주세요.'};
    const [a,b,c]=[...String(code)].map(Number);
    if(new Set([a,b,c]).size!==3)return {ok:false,reason:'세 숫자는 서로 달라야 해요. 같은 숫자가 있는지 확인해 보세요.'};
    if(a!==2*c)return {ok:false,reason:'첫째 숫자가 셋째 숫자의 2배인지 비교해 보세요.'};
    if(b+c!==7)return {ok:false,reason:'둘째와 셋째 숫자를 더하면 7이 되는지 확인해 보세요.'};
    if(a+b!==9)return {ok:false,reason:'첫째와 둘째 숫자를 더하면 9가 되는지 확인해 보세요.'};
    return {ok:true,reason:'모든 단서와 일치해요.'};
  }
  function question(s){
    if(s.step==='done')return {field:'lock',values:[]};
    if(s.step==='retry')return {field:'retry',values:[]};
    if(s.step==='total'){const total=s.a+s.b;return {field:'total',values:[...new Set([9,total,total===9?8:total+1])].sort((a,b)=>a-b)};}
    return {field:s.step,values:digits};
  }
  function choose(s,field,value){
    const n=Number(value);if(field!==s.step||!question(s).values.includes(n))return false;
    s.history.push({field,value:n});s.history=s.history.slice(-40);
    if(field==='first'){s.a=n;s.b=s.c=null;s.step='third';s.message=`첫째가 ${n}이라면, 셋째는 얼마여야 할까요? ‘첫째는 셋째의 2배’라는 단서와 비교해 보세요.`;}
    if(field==='third'){
      if(s.a!==2*n){s.message=`고른 셋째 ${n}을 두 배로 하면 첫째 ${s.a}와 같나요? 다른 숫자와 비교해 보거나 첫째 숫자부터 다시 골라 봐요.`;return true;}
      s.c=n;s.step='second';s.message=`첫째 ${s.a}, 셋째 ${n}으로 생각했군요. 둘째와 셋째의 합이 7이려면 둘째는 얼마일까요?`;
    }
    if(field==='second'){
      if(n+s.c!==7){s.message=`고른 둘째 ${n}과 셋째 ${s.c}를 더하면 7이 되나요? 다시 확인해 보세요.`;return true;}
      if(n===s.a||n===s.c){s.message='합은 맞지만 숫자가 겹쳐요. 세 숫자는 서로 달라야 한다는 단서도 확인해 보세요.';return true;}
      s.b=n;s.step='total';s.message=`이제 마지막 단서를 확인해 볼까요? 첫째와 둘째 숫자(${s.a} + ${n})의 합은 얼마인가요?`;
    }
    if(field==='total'){
      if(n!==s.a+s.b){s.message=`첫째와 둘째 숫자(${s.a} + ${s.b})를 다시 더해 보세요. 그 결과가 9인지도 함께 확인해야 해요.`;return true;}
      if(n!==9){s.step='retry';s.message=`맞아요. 둘을 더하면 ${n}이네요. 하지만 마지막 단서에서는 9여야 해요. 다른 첫째 숫자로 다시 생각해 볼까요?`;}
      else{s.step='done';s.message='고른 숫자가 모든 단서와 맞네요. 직접 찾은 세 숫자를 도어락에 눌러 확인해 보세요.';}
    }
    return true;
  }
  const api={clues,digits,fresh,check,question,choose};if(typeof module!=='undefined')module.exports=api;else root.B0AccessLogic=api;
})(typeof window!=='undefined'?window:globalThis);
