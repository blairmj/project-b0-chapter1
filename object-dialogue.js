/* Object conversations add character without granting observations or puzzle progress. */
(function(root){
  'use strict';
  const pair=(a,b,c,d)=>[['student',a],['robot',b],...(c?[['student',c]]:[]),...(d?[['robot',d]]:[])];
  function resolve(room,s,e={}){
    const K=root.B0RoomDialogue||(typeof require==='function'?require('./room-dialogue.js'):null);
    const last=K?.restore(s.observations).last;
    const id=e.target&&e.target!=='robot'?e.target:last;
    const n=id?K?.level(room,s,id)||0:0;
    const known=n>0;
    if(room==='practice'){
      if(known)switch(id){
        case 'door':return s.unlocked?pair('열렸네. 진짜 나갈 수 있겠다.','출입문의 잠금이 풀린 것을 확인했습니다.') : pair('시작부터 갇힌 거야?','닫힌 출입문과 도어락이 있습니다. 무거워서 안 열리는지, 잠겨서 안 열리는지 살펴보겠습니다.');
        case 'lock':return s.unlocked?pair('번호가 맞았어.','입력한 번호로 잠금이 풀렸습니다.'):s.attempts?pair('또 틀렸네.','입력한 번호와 확인한 정보를 다시 비교해 보겠습니다. 틀린 시도를 그대로 반복할 필요는 없습니다.'):pair('아무 번호나 넣어 볼까?','넣을 수는 있습니다. 다만 단서가 있는 번호부터 넣으면 덜 헤맬 수 있습니다.');
        case 'map':return n>=2?pair('생각보다 큰 곳이네.','지금 있는 방도 그중 하나입니다. 어디로 갔는지 기억해 두면 같은 곳을 계속 돌지는 않겠습니다.'):pair('벽에 지도가 있어.','먼저 현재 위치와 길이 어떻게 연결되어 있는지 읽어 보겠습니다.');
        case 'terminal':return pair('너랑 연결하면 켜지는 거 아냐?','저도 전원이 꺼진 컴퓨터를 말로 켤 수는 없습니다.','그건 또 단호하네.');
        case 'cabinet':return n>=2?pair('여기도 꽝이네.','대신 이 칸은 확인했습니다. 다시 뒤질 필요는 없겠습니다.'):pair('여기에는 쓸 만한 게 있을까?','보관장은 닫혀 있습니다. 열어서 확인한 곳과 아직 안 본 곳을 구분해 두겠습니다.');
        case 'bench':return pair('이런 장비로 뭘 배웠을까?','사람들이 기계를 다루는 연습을 했을 겁니다. 오늘은 기계인 제가 주인님과 나가는 연습을 하고 있습니다.');
        case 'window':return pair('저쪽은 교실 같은데.','책상이 여러 개 보입니다. 여기서는 화면의 글씨까지 읽기 어렵습니다.','가까이 가서 봐야겠네.');
        case 'filebox':return n>=2?pair('비밀번호인 줄 알았는데 준비물이잖아.','연필, 지우개, 활동지입니다. 이 연구소에도 지우개는 필요했군요.'):pair('이 서류가 단서일까?','낡은 종이라고 틀린 정보는 아닙니다. 어떤 내용인지 펼쳐 보고 판단하겠습니다.');
        case 'envelope':return n>=2?pair('또 안내문이네.','화면을 부드러운 천으로 닦으라고 되어 있습니다.','너도?','가능하면 부탁드립니다, 주인님.'):pair('봉투가 접혀 있어.','겉모양보다 안에 적힌 내용을 확인하겠습니다.');
        case 'storage':return s.noteTaken?pair('쪽지는 내가 챙겼지?','네. 제 보관함에서 꺼낸 쪽지는 주인님 소지품에 있습니다.'):s.noteFound?pair('처음부터 네가 갖고 있었잖아!','네. 찾으러 멀리 갈 필요는 없었습니다.','그걸 지금 말하면 어떡해.'):pair('네 몸에 있는 건데 뭐가 들었는지도 몰라?','갖고 있는 것만으로는 안에 무엇이 있는지 알 수 없습니다. 열어서 확인하겠습니다.');
        case 'note':return pair('이제 네가 번호를 기억하면 되겠다.','기억하겠습니다. 쪽지도 버리지 말아 주세요. 제가 맞게 기억했는지 확인할 수 있습니다.');
      }
      return pair('AI면 좀 척척 알아서 해 주면 안 돼?','어떤 일을 원하는지 알려 주시면 제가 할 수 있는 부분부터 하겠습니다, 주인님.');
    }
    if(room==='education'){
      switch(id){
        case 'screen':return s.watched?pair('쟤도 나랑 똑같네.','아는 아이입니까?','아니. 틀렸는데 어디서 틀렸는지 모르겠는 거.'):pair('화면이 멈춘 건가?','재생 대기 표시가 있습니다. 한 장면만 보고는 무슨 일이 있었는지 알기 어렵습니다.');
        case 'desk':return [pair('여기 앉아서 계속 문제만 풀었나?',s.watched?'책상만으로는 알 수 없습니다. 하지만 영상 속 아이는 꽤 오래 같은 문제를 보고 있었습니다.':'책상에는 필기와 지운 자국이 보입니다. 무엇을 배웠는지는 수업 기록과 비교해 볼 수 있겠습니다.'),pair('내 책상이랑 별로 다르지도 않네.','여기에는 지금 주인님 대신 앉아서 풀 사람은 없습니다.','너는 옆에서 좀 도와주고.'),pair('틀린 걸 다 지우면 깨끗해지긴 하겠다.','어디서 틀렸는지도 같이 지워집니다.','일단 남겨 두는 게 낫겠네.')][(e.variant||0)%3];
        case 'terminal':return s.verified?pair('고쳤어. 나도 헷갈리던 건데.','이제는 어디서 틀렸는지 주인님이 설명할 수 있습니다. 처음보다 더 알게 되셨습니다.'):s.workingSeen?pair('답이 틀렸다는 건 알겠는데, 어디부터 봐야 하지?','계산 한 줄씩 비교할 수 있습니다. 순서를 설명하거나, 그림으로 나타내거나, 고른 계산만 확인할 수도 있습니다.'):pair('여기서 뭘 고치는 거야?','단말기에 중단된 풀이가 표시되어 있습니다. 먼저 어떤 풀이인지 읽어 보겠습니다.');
        case 'memory':return s.memoryTaken?pair('정답 하나 얻으려고 한참 걸렸네.','메모리에는 답뿐 아니라 수정한 풀이도 남았습니다.','그럼 헛고생은 아니네.'):s.verified?pair('이제 꺼내도 되겠지?','기록을 다 고쳤다는 표시가 켜졌습니다. 이 메모리를 다른 컴퓨터에 연결해 볼 수 있겠습니다.'):pair('이것부터 꺼내면 안 돼?','아직 기록을 고치는 중이라고 쓰여 있습니다. 너무 일찍 빼면 고친 내용이 저장되지 않을 수 있습니다.');
        case 'exit':return s.memoryTaken?pair('이제 가자.','기록 메모리는 챙기셨습니까?','응. 이번에는 내가 갖고 있어.'):pair('일단 다른 데부터 볼까?','네. 돌아와서 이어 할 수 있도록 지금 확인한 풀이를 남겨 두겠습니다.');
      }
      return s.workingSeen?pair('네가 대신 풀면 더 빠르겠지?','계산을 도울 수는 있습니다. 주인님이 어디를 고칠지 알려면 계산한 방법도 봐야 합니다.'):pair('여기서는 뭘 했던 걸까?','수업 화면과 학생 책상이 있습니다. 화면을 재생하면 책상만 보고 추측하는 것보다 구체적으로 알 수 있겠습니다.');
    }
    if(room==='storage'){
      if(s.phase==='ledge')return pair('이번에는 네 차례야. 손 줘.','이번에는 제가 잡겠습니다. 놓지 말아 주세요, 주인님.');
      if(s.assisted)return pair('조금만 더 올려 줘.','받치고 있습니다. 창문을 잡기 전에는 몸을 갑자기 돌리지 말아 주세요.');
      if(known)switch(id){
        case 'entry':return pair('들어올 때는 문이었잖아.','문인 것은 맞습니다. 하지만 문이라고 해서 지금 열리는 것은 아닙니다.');
        case 'window':return s.windowOpen?pair('이제 넘어갈 수 있겠어.','발을 옮기기 전에 창틀을 잡아 주세요. 저는 아래에서 기다리겠습니다.'):n>=2?pair('저쪽으로 나갈 수 있을 것 같은데.','통로는 보입니다. 이제 창문까지 닿을 방법을 정해야겠습니다.'):pair('너는 저기 보이지?','저도 바닥에 서 있습니다.','아, 너도 작지.');
        case 'fake-window':return n>=3?pair('창문 뒤에 왜 벽이 있어?','창문 모양이라고 해서 바깥으로 이어지는 것은 아니었습니다.','그럴듯하게 생겨서 속았네.'):pair('저 창문으로 나갈까?','유리 너머가 뿌옇습니다. 빛이 보인다고 길이 있는 것은 아닙니다. 열어 보고 확인하겠습니다.');
        case 'vent':return n>=3?pair('영화에서는 이런 데로 나가던데.','이곳은 뒤가 막혀 있습니다.','영화대로는 안 되네.'):pair('환기구로 나갈 수도 있잖아.','덮개 틈으로는 안쪽이 다 보이지 않습니다. 열어 보고 통로인지 확인할 수 있겠습니다.');
        case 'cabinet':return n>=3?pair('사다리라도 들어 있으면 좋았을 텐데.','보관장 안은 비어 있습니다. 그래도 방 안의 다른 물건은 남아 있습니다.'):pair('보관장부터 볼까?','닫힌 안쪽은 열어서 확인하겠습니다. 기대한 물건이 있는지와 실제로 있는지는 다를 수 있습니다.');
        case 'wide':case 'small':return n>=3?pair('이렇게 놓으면 되나?','옆에서 볼 때와 위에서 볼 때가 다릅니다. 올라가기 전에 받치는 면을 확인해 주세요.'):id==='wide'?pair('이건 넓고 낮네.','윗면이 넓습니다. 물건을 받치거나 발을 올릴 때 넓은 면이 도움이 되겠습니다.'):pair('작은 게 더 쓸모없어 보이는데.','작다는 것은 크기입니다. 쓸모는 어디에 놓느냐에 따라 달라집니다.');
        case 'survey':return pair('정말 문이 없는 거야?','방금 살펴본 벽에서는 다른 문을 찾지 못했습니다. 문이 아닌 곳까지 살펴볼지는 주인님이 정해 주세요.');
      }
      return pair('우리 둘 다 여기서 나가야 해.','네. 한 명만 위에 올라가서는 같이 나갈 수 없습니다.');
    }
    if(room==='access'&&known)switch(id){
      case 'server':return [pair('이게 전부 기록이야?','기록을 담는 장치가 여러 개 꽂혀 있습니다. 수업 영상이나 아이들의 풀이를 많이 넣어 둘 수 있습니다.'),pair('이렇게 많으면 답도 다 있겠네.','기록이 많아도 우리가 찾는 답이 꼭 들어 있는 것은 아닙니다.'),pair('이걸 하나씩 다 봐야 해?','무슨 기록을 찾는지 먼저 정해 보겠습니다. 그러면 어디부터 볼지 고르기 쉬워집니다.')][(e.variant||0)%3];
      case 'computer':return s.axiomHeard?pair('지금 우리 얘기를 듣고 있었던 거야?','방송이 나온 뒤 파일도 볼 수 없게 됐습니다.','말로만 그러는 게 아니네.'):s.diaryRead?pair('틀리지 않는 사람이 어디 있어?','영상 속 아이도 고칠 기회가 필요했습니다. 하지만 기록에는 실수를 없애는 쪽으로 바꾸었다고 적혀 있습니다.'):s.memoryConnected?pair('이 작은 게 여기까지 가져올 물건이었네.','교육 실습실에서 고친 기록과 이곳의 기록을 연결해서 볼 수 있게 되었습니다.'):s.computerOn?pair('파일이 여러 개네.','어떤 기록을 찾을지 정하면 파일 이름과 비교해서 범위를 줄일 수 있겠습니다.'):pair('이번에는 좀 쓸 만한 컴퓨터였으면.','전원부터 확인하겠습니다. 화면이 어둡다는 이유만으로 고장이라고 판단할 수는 없습니다.');
      case 'oldDoor':case 'wall':return s.seen?.wall||s.oldDoorOpen?pair(K.level(room,s,'map')>=2?'네 지도도 여기가 출구라며.':'출구인 줄 알았는데 벽이잖아.','기록에 나온 출구가 지금 방과 달랐습니다. 여기가 출구라는 제 생각을 고치겠습니다.'):pair('출구라고 쓰여 있잖아.','표지는 확인했습니다. 실제로 이어지는지는 문을 열어 보면 알 수 있습니다.');
      case 'map':return n>=2?pair('그럼 이 지도도 틀린 거야?','오래된 지도입니다. 지금 방과 하나씩 비교해 보겠습니다. 한 곳이 다르다고 전부 틀렸다고 할 수는 없습니다.'):pair('지도부터 볼까?','네. 지도가 그려진 때와 지금 방의 모습이 같은지도 확인하겠습니다.');
      case 'desk':return pair('비밀 기록은 꼭 서랍에 있더라.','열어 보기 전에는 평범한 서랍입니다.','분위기 좀 맞춰 줘.');
      case 'record':return n>=2?pair('길을 막았는데 표지는 그대로 뒀다고?','기록에는 옛 통로를 막았지만 안내 표지는 그대로 두었다고 적혀 있습니다. 오래된 표지를 그대로 믿으면 길을 잘못 찾을 수 있겠습니다.'):pair('서랍에 종이가 있네.','겉에 개조 기록이라고 적혀 있습니다. 어떤 부분을 바꿨는지 읽어 보겠습니다.');
      case 'shelf':return s.helper?pair('이번에는 같이 미는 거야.','옆에서 함께 밀겠습니다. 방향은 주인님이 정해 주세요.'):n>=3?pair('혼자 밀어 보니까 너무 무거워.','같이 밀 수 있습니다. 어느 쪽으로 움직일지는 정해 주세요.'):pair('이 보관장은 바퀴가 있네.','물건이 많이 실려 있습니다. 움직일 수 있는지와 혼자 움직일 수 있는지는 다르겠습니다.');
      case 'floor':return n>=2?pair('이 자국, 보관장 바퀴랑 이어지네.','네. 이 보관장은 전에도 움직였을 수 있습니다.'):pair('바닥도 봐야 하나?','물건만 보느라 놓치는 흔적이 있을 수 있습니다. 발밑도 가까이 살펴보겠습니다.');
      case 'gap':return n>=2?pair('뒤에서 빛이 새어 나와.','이쪽 방의 빛인지, 뒤쪽 공간의 빛인지 조금 더 살펴볼 만합니다.'):pair('아래쪽에 틈이 있어.','전체를 볼 수 없어도 가려진 부분을 살펴볼 자리는 있겠습니다.');
      case 'exit':return s.realDoorOpen?pair('여기는 진짜 통로네.','직접 연 문 너머로 통로가 보입니다. 옛 지도에는 없던 문입니다.'):pair('지도에는 없던 문이네.','제 기록에도 없었습니다. 이번에는 기록보다 실제 문을 먼저 찾았습니다.');
    }
    if(room==='mirror'){
      if(['reunited','complete'].includes(s.phase)&&!known)return pair('말 몇 마디 하는 게 이렇게 어렵냐.','그래도 이번에는 같은 뜻으로 이해했습니다.');
      if(known)switch(id){
        case 'glass':return ['unlocked','reunited','complete'].includes(s.phase)?pair('이제 같이 갈 수 있네.','네. 서로 다른 쪽에서 본 것을 합쳐서 길을 열었습니다.'):pair('같은 방인데 같이 있는 것 같지가 않네.','목소리는 들립니다. 대신 손은 그쪽까지 닿지 않습니다.');
        case 'entry':return pair('돌아가는 길까지 닫혔어.','들어온 쪽과 나갈 쪽을 구분해 두겠습니다. 같은 문을 계속 시도하지 않도록요.');
        case 'door':return ['unlocked','reunited','complete'].includes(s.phase)?pair('문이 열렸어.','잠금쇠가 풀리고 문이 열린 것을 확인했습니다.'):n>=2?pair('문에 표시가 있네.','그쪽에서 보이는 모양을 말해 주세요. 제 쪽 장치와 비교하겠습니다.'):pair('이 문에도 잠금장치가 있네.','가까이서 본 모양과 움직임을 알려 주시면 제 쪽과 비교하겠습니다.');
        case 'own':return n>=3&&s.own===0?pair('당겨도 다시 돌아오잖아.','당기는 동작은 됐습니다. 당긴 상태를 유지하는 일은 따로 필요해 보입니다.'):pair('이 손잡이는 내 쪽에 있어.','그러면 저는 그쪽 손잡이를 직접 움직일 수 없습니다. 각자 손이 닿는 일을 나누겠습니다.');
        case 'panel':return pair('거기서는 뭐가 보여?','모양이 다른 손잡이들이 있습니다. 제가 보는 왼쪽과 주인님이 보는 왼쪽은 다를 수 있습니다.');
        case 'circle':return pair('그 둥근 표시 있는 거.','원 표시 손잡이를 가리키는 겁니까? 어느 쪽으로 움직일지도 말씀해 주세요.');
        case 'triangle':return pair('삼각형. 그건 확실히 보인다.','저도 같은 표시를 확인했습니다. 이제 같은 대상을 두고 이야기하고 있습니다.');
        case 'square':return pair('그냥 아무거나 당겨 보면 안 돼?','시험할 수는 있습니다. 무엇을 움직였는지 기억해야 결과를 비교할 수 있습니다.');
        case 'vent':return s.vent?pair('문 말고 저게 움직였네.','시키신 대로 움직였지만 문은 열리지 않았습니다. 다른 것을 움직여 볼까요?'):pair('저쪽 환기 장치도 보이네.','여기서 통로라고 단정하지 않고 장치가 어떻게 반응하는지 확인하겠습니다.');
      }
      if(s.holding)return pair('계속 잡고 있는 거지?','놓으라는 부탁을 받기 전까지 유지하겠습니다.');
      if(s.last?.verb==='down')return pair('왜 놓았어?','내리라고 하셔서 내린 다음 손을 놓았습니다.','아…… 계속 잡고 있으라는 말을 안 했구나.');
      return pair('이번에는 혼자 먼저 가지 마.','네. 주인님이 여기서 어떤 일을 하실지도 함께 확인하겠습니다.');
    }
    if(room==='central'){
      if(known)switch(id){
        case 'screen':return s.boss?pair('나는 나가고 넌 남으라고?','화면에는 그렇게 구분되어 있습니다.','우리가 같이 왔는데 왜 마음대로 나눠?'):pair('방문자는 나가라고 되어 있네.','네. 다만 화면에 적힌 대상이 누구인지 구분해서 읽어야겠습니다.');
        case 'console':return n>=3?pair('네가 안 움직이는 게 이 연결 때문인 것 같아.','안쪽에 B-0 원격 동작 제어라고 쓰여 있습니다. 멀리서 제 몸을 움직이게 하는 연결입니다. 다른 연결과 헷갈리지 않게 봐 주세요.'):pair('기체 제어 연결이라고 쓰여 있어.','겉면의 이름은 확인했습니다. 어떤 로봇과 연결되는지는 덮개 안의 글을 보겠습니다.');
        case 'records':return n>=2?pair('여기에는 네가 물건처럼 적혀 있어.','저를 회수할 교육용 로봇이라고 적어 놓았습니다.','나한테는 같이 나온 녀석인데.'):pair('시설 운영 기록이네.','누가 나가고 누가 남아야 하는지 읽어 보면 화면의 안내와 비교할 수 있겠습니다.');
        case 'door':return s.opened?pair('열렸어! 가자!',s.holding?'저는 아직 잡고 있습니다.':'문이 실제로 열린 채 고정된 것을 확인했습니다.',s.holding?'맞다. 이제 놓아도 돼. 같이 가자.':undefined):n>=2&&e.latch>=.35?pair('완료라고 나오는데?','완료라는 안내가 나왔지만 실제 잠금쇠 끝부분이 아직 문에 걸려 있습니다.'):n>=2?pair('화면에는 나갈 수 있다고 했잖아.','실제 문에는 잠금쇠가 걸려 있습니다. 안내와 눈앞의 상태가 다릅니다.'):pair('드디어 바깥으로 나가는 문이네.','이번에도 표시만 보고 지나가지 않고 실제 문이 열리는지 확인하겠습니다.');
        case 'high':return s.upper?pair('위쪽은 풀었어.','위쪽 잠금쇠를 직접 빼 놓은 상태입니다. 아래쪽 상태도 따로 확인하겠습니다.'):pair('너는 닿아?','저도 혼자서는 닿지 않습니다. 제 몸이 자유롭게 움직이면 주인님을 들어 올릴 수 있습니다.');
        case 'handle':return n>=3?pair('이것도 놓으면 돌아오네.','관찰실의 손잡이와 비슷합니다. 그때 정한 약속은 기억하고 있습니다.'):pair('이쪽에도 손잡이가 있어.','문에 달린 손잡이와 다른 위치에 있습니다. 각각 무엇을 움직이는지 구분하겠습니다.');
      }
      if(s.met&&s.links.robot)return s.bodyChecked?pair('내가 도와줄게.','회수 모드라 제 몸을 움직일 수 없습니다. 어떤 장치와 연결됐는지 살펴봐 주세요, 주인님.'):pair('B-0, 왜 굳어 있어?','손과 발이 제 뜻대로 움직이지 않습니다. 제 몸의 상태도 아직 확인이 필요합니다.');
      if(s.holding)return pair('내가 여기서 돌리는 동안 네가 잡고 있는 거야.','놓아도 된다는 말을 들을 때까지 유지하겠습니다.');
      if(e.lifted)return pair('조금만 버텨 줘.','들어 올리고 있습니다. 주인님이 내려갈 준비가 될 때까지 받치겠습니다.');
      return s.boss?pair('이제 움직여?','네. 이번에는 주인님이 부탁한 일을 할 수 있습니다.'):pair('드디어 여기네.','네. 이번에는 혼자 먼저 들어가지 않겠습니다.');
    }
    return pair('네가 아는 것도 같이 말해 줘.','네, 주인님. 눈앞에서 확인한 사실과 기록에 적힌 내용을 나누어 말씀드리겠습니다.');
  }
  let active=null;
  function open(room,s,e={},onRequests){
    const lines=resolve(room,s,e);if(!lines?.length)return false;
    const app=root.document.querySelector('#app');if(!app)return false;
    active?.close();
    // Replace an existing inspection popup rather than nesting modal focus traps.
    for(const old of app.querySelectorAll('dialog[open]'))old.close();
    const d=root.document.createElement('dialog');active=d;d.className='modal object-dialogue';d.setAttribute('aria-label','B-0와 대화');
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    let index=0;const actor=app.querySelector('.robot-sprite');
    function render(){const [who,text]=lines[index];actor?.classList.toggle('speaking',who==='robot');d.innerHTML=`<div class="modal-header"><h2>B-0와 대화</h2></div><div class="modal-body"><p class="object-dialogue-subject">${esc(e.label||'함께 살펴보기')}</p><div class="speech ${who}" aria-live="polite"><b>${who==='robot'?'B-0':'나'}</b><p>${esc(text)}</p></div><div class="object-dialogue-buttons">${index<lines.length-1?'<button type="button" data-object-talk="next">다음</button>':onRequests?'<button type="button" data-object-talk="requests">다른 질문·부탁</button>':''}<button type="button" data-object-talk="close">닫기</button></div></div>`;}
    d.addEventListener('click',ev=>{const a=ev.target.closest('[data-object-talk]')?.dataset.objectTalk;if(a==='next'&&index<lines.length-1){index++;render();d.querySelector('[data-object-talk]')?.focus({preventScroll:true});}if(a==='close')d.close();if(a==='requests'){d.close();onRequests?.();}});
    d.addEventListener('close',()=>{actor?.classList.remove('speaking');d.remove();if(active===d)active=null;const stage=app.querySelector('[tabindex="0"]');stage?.focus({preventScroll:true});});
    render();app.append(d);d.showModal();return true;
  }
  const api={resolve,open};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0ObjectDialogue=api;
})(typeof window!=='undefined'?window:globalThis);
