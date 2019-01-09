const auth = firebase.auth();
const ui = new firebaseui.auth.AuthUI(auth);

auth.onAuthStateChanged(currentUser => {
  const pageAuth = document.getElementById('js-page-auth');
  const pageMain = document.getElementById('js-page-main');

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

const init = (userId) => {
  const database = firebase.database();
  const form = document.getElementById('js-form-memo');
  const memoTextField = document.getElementById('js-content-text-field');
  const listMemo = document.getElementById('js-list-memo');
  const linkPreviousDay = document.getElementById('js-link-previous-day');
  const linkNextDay = document.getElementById('js-link-next-day');
  const normalizeDateElm = x => `0${x}`.slice(-2);
  const queryStr = location.search.slice(1);
  const queries = (queryStr.length != 0) ? queryStr.split('&').map(x => x.split('=')) : [];
  const paramDate = (queries.find(x => x[0] === 'date') || [])[1];
  const currentDate = (paramDate != null) ? new Date(paramDate) : new Date();
  const beginningOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
  const endOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);
  const summaryArea = document.getElementById('js-summary-area');
  const summaryBtn = document.getElementById('js-summary-btn');
  const previousDay = new Date(currentDate.getTime() - 24 * 3600 * 1000);
  const nextDay = new Date(currentDate.getTime() + 24 * 3600 * 1000);

  linkPreviousDay.setAttribute('href', `?date=${previousDay.getFullYear()}-${normalizeDateElm(previousDay.getMonth() + 1)}-${normalizeDateElm(previousDay.getDate())}`);
  linkNextDay.setAttribute('href', `?date=${nextDay.getFullYear()}-${normalizeDateElm(nextDay.getMonth() + 1)}-${normalizeDateElm(nextDay.getDate())}`);

  database.ref(`users/${userId}/memos`).orderByChild('timestamp').startAt(beginningOfCurrentDate.getTime()).endAt(endOfCurrentDate.getTime()).on('value', r => {
    const data = r.val();

    for(let i = listMemo.children.length - 1; i >= 0; --i) {
      listMemo.removeChild(listMemo.children[i]);
    }

    for(let v in data) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      const createdAt = new Date(data[v].timestamp);
      const createdAtStr = `${createdAt.getFullYear()}-${normalizeDateElm(createdAt.getMonth() + 1)}-${normalizeDateElm(createdAt.getDate())} ${normalizeDateElm(createdAt.getHours())}:${normalizeDateElm(createdAt.getMinutes())}:${normalizeDateElm(createdAt.getSeconds())}`;
      const contents = data[v].contents;

      span.textContent = contents
      span.classList.add('js-memo-contents');
      li.textContent = `${createdAtStr} > `;
      li.classList.add('p-memo-list__item');
      li.appendChild(span);

      listMemo.appendChild(li);
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

  summaryBtn.addEventListener('click', () => {
    const contentsDOM = document.querySelectorAll('.js-memo-contents');
    let contents = '';

    contentsDOM.forEach(x => {
      contents += `${x.textContent}\n`;
    });

    summaryArea.value = contents;
  });
};

window.addEventListener('load', () => {
  const btnToSignOut = document.getElementById('js-sign-out');

  btnToSignOut.addEventListener('click', () => {
    auth.signOut();
  });
});
