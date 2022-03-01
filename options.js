const youTrackUrlInput = document.querySelector('#youTrackURL');

chrome.storage.sync.get(['youTrackURL'], function (params) {
  if (params.youTrackURL) {
    youTrackUrlInput.value = params.youTrackURL;
  }
})

youTrackUrlInput.addEventListener('change', updateStorage);

function updateStorage() {
  chrome.storage.sync.set({[this.id]: this.value});
}