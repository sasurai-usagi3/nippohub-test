window.addEventListener('load', () => {
  const auth = firebase.auth();
  const database = firebase.database();
  const ui = new firebaseui.auth.AuthUI(auth);
  const normalizeDateElm = x => `0${x}`.slice(-2);
  Vue.component('memo-form', {
    template: document.getElementById('js-template-form-memo'),
    props: ['userIdToSend'],
    methods: {
      submit: function() {
        const memoTextField = document.getElementById('js-content-text-field');
        const userId = this.userIdToSend;

        database.ref(`users/${userId}/memos`).push({
          contents: memoTextField.value,
          userId: userId,
          timestamp: Date.now()
        });
        memoTextField.value = '';
      }
    }
  });
  const linkPreviousDay = new Vue({
    el: '#js-link-previous-day',
    data: {
      url: '#'
    }
  });
  const linkNextDay = new Vue({
    el: '#js-link-next-day',
    data: {
      url: '#'
    }
  });
  const memoBoard = new Vue({
    el: '#js-memo-board',
    data: {
      userIdToSend: null,
      date: ''
    }
  });
  const listMemo = new Vue({
    el: '#js-list-memo',
    data: {
      memos: []
    }
  });
  const modal = new Vue({
    el: '#js-modal',
    data: {
      hidden: true
    },
    methods: {
      close: function() {
        this.hidden = true;
      }
    }
  });
  const pageAuth = document.getElementById('js-page-auth');
  const pageMain = document.getElementById('js-page-main');
  const btnToSignOut = document.getElementById('js-sign-out');
  const summaryArea = document.getElementById('js-summary-area');
  const summaryBtn = document.getElementById('js-summary-btn');
  const queryStr = location.search.slice(1);
  const queries = (queryStr.length != 0) ? queryStr.split('&').map(x => x.split('=')) : [];
  const paramDate = (queries.find(x => x[0] === 'date') || [])[1];
  const currentDate = (paramDate != null) ? new Date(paramDate) : new Date();
  const previousDay = new Date(currentDate.getTime() - 24 * 3600 * 1000);
  const nextDay = new Date(currentDate.getTime() + 24 * 3600 * 1000);
  const beginningOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
  const endOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);
  const init = userId => {
    database.ref(`users/${userId}/memos`).orderByChild('timestamp').startAt(beginningOfCurrentDate.getTime()).endAt(endOfCurrentDate.getTime()).on('value', r => {
      const data = r.val();

      listMemo.memos = [];

      for(let v in data) {
        const createdAt = new Date(data[v].timestamp);
        const createdAtStr = `${createdAt.getFullYear()}-${normalizeDateElm(createdAt.getMonth() + 1)}-${normalizeDateElm(createdAt.getDate())} ${normalizeDateElm(createdAt.getHours())}:${normalizeDateElm(createdAt.getMinutes())}:${normalizeDateElm(createdAt.getSeconds())}`;
        const contents = data[v].contents;

        listMemo.memos.push({contents: contents, createdAt: createdAtStr});
      }
    });
  };

  memoBoard.date = `${currentDate.getFullYear()}-${normalizeDateElm(currentDate.getMonth() + 1)}-${normalizeDateElm(currentDate.getDate())}`;
  linkPreviousDay.url = `?date=${previousDay.getFullYear()}-${normalizeDateElm(previousDay.getMonth() + 1)}-${normalizeDateElm(previousDay.getDate())}`;
  linkNextDay.url = `?date=${nextDay.getFullYear()}-${normalizeDateElm(nextDay.getMonth() + 1)}-${normalizeDateElm(nextDay.getDate())}`;

  btnToSignOut.addEventListener('click', () => {
    auth.signOut();
  });

  summaryBtn.addEventListener('click', () => {
    const contentsDOM = document.querySelectorAll('.js-memo-contents');
    let contents = '';

    contentsDOM.forEach(x => {
      contents += `${x.textContent}\n`;
    });

    summaryArea.value = contents;
    modal.hidden = false;
  });

  auth.onAuthStateChanged(currentUser => {
    if(currentUser != null) {
      pageAuth.setAttribute('hidden', 'hidden');
      pageMain.removeAttribute('hidden');
      init(currentUser.uid);
      //form.userIdToSend = currentUser.uid;
      memoBoard.userIdToSend = currentUser.uid;
    } else {
      ui.start('#js-form-auth-area', {
        signInSuccessUrl: '/',
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID
        ]
      });

      return;
    }
  });
});
