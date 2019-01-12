const auth = firebase.auth();
const ui = new firebaseui.auth.AuthUI(auth);
const normalizeDateElm = x => `0${x}`.slice(-2);
const queryStr = location.search.slice(1);
const queries = (queryStr.length != 0) ? queryStr.split('&').map(x => x.split('=')) : [];
const paramDate = (queries.find(x => x[0] === 'date') || [])[1];
const currentDate = (paramDate != null) ? new Date(paramDate) : new Date();

window.addEventListener('load', () => {
  const titleDate = new Vue({
    el: '#js-title-date',
    data: {
      date: ''
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
  const pageAuth = document.getElementById('js-page-auth');
  const pageMain = document.getElementById('js-page-main');
  const btnToSignOut = document.getElementById('js-sign-out');
  const summaryArea = document.getElementById('js-summary-area');
  const summaryBtn = document.getElementById('js-summary-btn');
  const previousDay = new Date(currentDate.getTime() - 24 * 3600 * 1000);
  const nextDay = new Date(currentDate.getTime() + 24 * 3600 * 1000);

  titleDate.date = `${currentDate.getFullYear()}-${normalizeDateElm(currentDate.getMonth() + 1)}-${normalizeDateElm(currentDate.getDate())}`;
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
  });

  auth.onAuthStateChanged(currentUser => {

    if(currentUser != null) {
      pageAuth.setAttribute('hidden', 'hidden');
      pageMain.removeAttribute('hidden');
      init(currentUser.uid);
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

const init = (userId) => {
  const database = firebase.database();
  const form = document.getElementById('js-form-memo');
  const memoTextField = document.getElementById('js-content-text-field');
  const listMemo = new Vue({
    el: '#js-list-memo',
    data: {
      memos: []
    }
  });
  const beginningOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
  const endOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);

  database.ref(`users/${userId}/memos`).orderByChild('timestamp').startAt(beginningOfCurrentDate.getTime()).endAt(endOfCurrentDate.getTime()).on('value', r => {
    const data = r.val();

    listMemo.memo = [];

    for(let v in data) {
      const createdAt = new Date(data[v].timestamp);
      const createdAtStr = `${createdAt.getFullYear()}-${normalizeDateElm(createdAt.getMonth() + 1)}-${normalizeDateElm(createdAt.getDate())} ${normalizeDateElm(createdAt.getHours())}:${normalizeDateElm(createdAt.getMinutes())}:${normalizeDateElm(createdAt.getSeconds())}`;
      const contents = data[v].contents;

      listMemo.memos.push({contents: contents, createdAt: createdAtStr});
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    database.ref(`users/${userId}/memos`).push({
      contents: memoTextField.value,
      userId: userId,
      timestamp: Date.now()
    });
    memoTextField.value = '';
  });
};
