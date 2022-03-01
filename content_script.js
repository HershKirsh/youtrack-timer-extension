function getInProgrssCards() {
  const inProgressCardElemes = document.querySelectorAll('tbody>tr:nth-child(2)>td:nth-child(2)>div>div.agile-sort-connection>yt-agile-card');
  const inProgressTasks = [...inProgressCardElemes].map((card, i) => {
    return {
      taskIdName: card.querySelector('.yt-agile-card__summary').innerText,
      taskName: card.querySelector('.yt-agile-card__summary>span').innerText,
      cardElement: card,
      timerButton: card.querySelectorAll('yt-issue-custom-field-lazy[title^="Timer"], yt-issue-custom-field-lazy[data-test="Timer"], button')[0],
      timerStatus: card.querySelectorAll('yt-issue-custom-field-lazy[title^="Timer"], yt-issue-custom-field-lazy[data-test="Timer"], button')[0].innerText,
      index: i
    };
  });
  return inProgressTasks;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.message.name) {
    case 'getInProgressTasks':
      sendResponse(
        getInProgrssCards().map(card => {
          return {taskIdName: card.taskIdName, taskName: card.taskName, index: card.index, timerStatus: card.timerStatus};
        })
      );
      break;
    case 'toggleTimer':
      handleTimerToggle(request.message.taskIdName).then(response => {
        sendResponse(response);
      });
      break;
  }
  return true;
});

async function handleTimerToggle(taskIdName) {
  const cards = getInProgrssCards();
  const card = cards.filter(card => card.taskIdName === taskIdName);
  if (card[0]) {
    if (card[0].timerStatus === 'Start') {
      const update = await toggleTimer(card[0], 'Stop');
      return {message: 'success', updatedCards: [update]};
    } else {
      const runningCards = cards.filter(c => c.timerStatus === 'Start');
      card[0].waitingToStart = true;
      runningCards.push(card[0]);
      const updatedCards = await stopAllStartOne(runningCards);
      return {message: 'success', updatedCards: updatedCards};
    }
  } else {
    return {err: 'Could not find this card'};
  }
}

async function stopAllStartOne(cards) {
  const updates = [];
  for (let i = 0; i < cards.length; i++) {
    const update = await toggleTimer(cards[i], cards[i].waitingToStart ? 'Start' : 'Stop');
    updates.push(update);
  }
  return updates;
}

function toggleTimer(card, toggleTo) {
  return new Promise(res => {
    card.cardElement.firstChild.classList.add('yt-agile-card_focused');
    card.timerButton.click();
    let clicked = false
    const loadingInt = setInterval(() => {
      if (document.querySelector(`[id^="list-item"] > div > span[title="${toggleTo}"]`)) {
        if (!clicked){
        document.querySelector(`[id^="list-item"] > div > span[title="${toggleTo}"]`).click();
        }
        if (card.timerButton.innerText !== toggleTo) {
          card.cardElement.firstChild.classList.remove('yt-agile-card_focused');
          clearInterval(loadingInt);
          res({taskIdName: card.taskIdName, newStatus: toggleTo});
        }
      }
    }, 10);
  });
}
