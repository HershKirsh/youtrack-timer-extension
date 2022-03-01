const taskList = document.querySelector('#task-list');
const container = document.querySelector('.container');
const message = document.querySelector('.message');
const backgroundPage = chrome.extension.getBackgroundPage();
let youTrackURL;
let taskCount = 0;

chrome.storage.sync.get(['youTrackURL'], function (params) {
  youTrackURL = params.youTrackURL;
});

document.querySelector('.logo').addEventListener('click', backgroundPage.focusYouTrackTab);

function msgContent(data) {
  container.style.setProperty('--processing', 'grid');
  chrome.tabs.query({}, function (tabs) {
    const youTrackTab = tabs.filter(tab => tab.url.includes('.myjetbrains.com/youtrack/agiles'));
    if (youTrackTab[0]) {
      chrome.tabs.sendMessage(youTrackTab[0].id, {message: data}, res => {
        if (res) {
          switch (data.name) {
            case 'getInProgressTasks':
              taskCount = res.length;
              res.forEach(task => {
                taskList.insertAdjacentHTML('beforeEnd', `<li class="task-list-item" data-task-id-name="${task.taskIdName}"><span>${task.taskName}</span><button class="button fas start-timer ${task.timerStatus === 'Start' ? 'stop-timer' : ''}"></button></li>`);
              });
              document.querySelectorAll('.task-list-item').forEach(task => {
                task.addEventListener('click', toggleTimerRunning);
              });
              container.style.setProperty('--processing', 'none');
              break;
            case 'toggleTimer':
              renderUpdates(res);
              break;
          }
        }
      });
    } else {
      container.style.setProperty('--processing', 'none');
      if (youTrackURL) {
        message.innerHTML = '<h3>Opening YouTrack tab now...</h3><div class="loading-count-down"><span></span></div>';
        message.classList.add('active');
        setTimeout(function () {
          backgroundPage.openYouTrackTab(tabs.filter(tab => tab.active === true)[0], youTrackURL);
        }, 1000);
      } else {
        message.innerHTML = '<h3>We did not find a YouTrack-Agile-Board tab</h3><p>You can add a URL at the <span id="open-options">extension options page</span> to open in the future if no YouTrack tab is present</p>';
        message.classList.add('active');
        document.querySelector('#open-options').addEventListener('click', () => {
          chrome.runtime.openOptionsPage(() => {});
        });
      }
    }
  });
}

msgContent({name: 'getInProgressTasks'});

function toggleTimerRunning() {
  msgContent({name: 'toggleTimer', taskIdName: this.dataset.taskIdName});
}

function renderUpdates(updates) {
  if (updates.err) {
    message.innerHTML = updates.err;
    message.classList.add('active');
  } else {
    updates.updatedCards.forEach(card => {
      document.querySelector(`[data-task-id-name="${card.taskIdName}"]>button.start-timer`).classList[card.newStatus === 'Start' ? 'add' : 'remove']('stop-timer');
    });
  }
  container.style.setProperty('--processing', 'none');
}


document.addEventListener("keydown", (e)=> {
  if (parseInt(e.key) && e.key > 0 && e.key <= taskCount) {
    toggleTimerRunning.bind(document.querySelector(`li:nth-child(${e.key})`))()
  }
})