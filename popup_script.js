const taskList = document.querySelector('#task-list');
const container = document.querySelector('.container');
const message = document.querySelector('.message');
const cardNameInput = document.querySelector('#card-name');
let youTrackURL;
let taskCount = 0;

chrome.storage.sync.get(['youTrackURL'], params => (youTrackURL = params.youTrackURL));

document.querySelector('.logo').addEventListener('click', focusYouTrackTab);

function focusYouTrackTab() {
  chrome.tabs.query({}, function (tabs) {
    const youTrackTab = tabs.filter(tab => tab.url.includes('.myjetbrains.com/youtrack/agiles'));
    if (youTrackTab[0]) {
      chrome.tabs.update(youTrackTab[0].id, {active: true});
    }
  });
}

function runFunc(func, callback, args) {
  chrome.tabs.query({}, tabs => {
    const youTrackTab = tabs.find(tab => tab.url.includes('.myjetbrains.com/youtrack/agiles'));
    chrome.scripting.executeScript(
      {
        target: {tabId: youTrackTab.id},
        func: func,
        args: args,
        world: 'MAIN'
      },
      callback
    );
  });
}

function getInProgrssCards() {
  const inProgressCardElemes = document.querySelectorAll('tbody>tr:nth-child(2)>td:is(:nth-child(2),:nth-child(3))>div>div.agile-sort-connection>yt-agile-card');
  const inProgressTasks = [...inProgressCardElemes].map((card, i) => {
    return {
      taskIdName: card.querySelector('.yt-agile-card__summary').innerText,
      taskName: card.querySelector('.yt-agile-card__summary>span').innerText,
      cardElement: card,
      index: i
    };
  });
  return inProgressTasks.map(card => {
    return {taskIdName: card.taskIdName, taskName: card.taskName, index: card.index};
  });
}

container.style.setProperty('--processing', 'grid');
runFunc(getInProgrssCards, renderCardList);

function renderCardList(response) {
  const res = response[0].result || {};
  taskCount = res.length;
  res.forEach(task => {
    taskList.insertAdjacentHTML('beforeEnd', `<li class="task-list-item" data-task-id-name="${task.taskIdName}"><span>${task.taskName}</span></li>`);
  });
  container.style.setProperty('--processing', 'none');
}

cardNameInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !e.target.value) return;
  runFunc(createNewCard, createCardRes, [e.target.value]);
});

function createCardRes(res) {
  console.log('res', res[0]);
  console.log('res result', res[0].result);
  if (res[0].result === 'success') {
    cardNameInput.value = '';
    message.innerText = 'Card created'
  }
}

async function createNewCard(name) {
  function waitForElem(selector) {
    return new Promise(res => {
      const int = setInterval(() => {
        const elem = document.querySelector(selector);
        if (elem) {
          clearInterval(int);
          res(elem);
        }
      }, 50);
    });
  }
  document.querySelector('tbody>tr:nth-child(2)>td:nth-child(3) [data-test="add-new-card"]').click();
  (await waitForElem('yt-issue-fields-panel tr:nth-child(4) button')).click();
  (await waitForElem('.ReactVirtualized__Grid__innerScrollContainer>div:nth-child(3) button')).click();
  await new Promise(res => setTimeout(() => res(), 500));
  const nameInput = await waitForElem('.ring-input');
  nameInput.value = name;
  nameInput.dispatchEvent(new CustomEvent('change'));
  document.querySelector('[data-test="save-issue"]').click();
  return 'success';
}

chrome.tabs.query({}, function (tabs) {
  const youTrackTab = tabs.filter(tab => tab.url.includes('.myjetbrains.com/youtrack/agiles'));
  if (youTrackTab[0]) {
    runFunc(getInProgrssCards, renderCardList);
    container.style.setProperty('--processing', 'none');
    return;
  }
  if (youTrackURL) {
    message.innerHTML = '<h3>Opening YouTrack tab now...</h3><div class="loading-count-down"><span></span></div>';
    message.classList.add('active');
    setTimeout(function () {
      const currentTab = tabs.filter(tab => tab.active === true)[0];
      const currentTabId = currentTab.id;
      chrome.tabs.create({'url': youTrackURL, 'index': currentTabId + 1}, function (tab) {
        // setTimeout(function () {
        //   chrome.tabs.update(currentTabId, {active: true});
        // }, 500);
      });
    }, 1000);
    return;
  }
  message.innerHTML = '<h3>We did not find a YouTrack-Agile-Board tab</h3><p>You can add a URL at the <span id="open-options">extension options page</span> to open in the future if no YouTrack tab is present</p>';
  message.classList.add('active');
  document.querySelector('#open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage(() => {});
  });
});

// document.addEventListener('keydown', e => {
//   if (parseInt(e.key) && e.key > 0 && e.key <= taskCount) {
//     toggleTimerRunning.bind(document.querySelector(`li:nth-child(${e.key})`))();
//   }
// });
